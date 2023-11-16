// a bit of copy-paste from https://github.com/compio-rs/compio/blob/master/compio-http/src/stream.rs
use std::{
    future::Future,
    io,
    ops::DerefMut,
    path::Path,
    pin::Pin,
    task::{Context, Poll},
};

use compio_buf::{BufResult, IoBuf, IoBufMut, IoVectoredBuf, IoVectoredBufMut};
use compio_io::{compat::SyncStream, AsyncRead, AsyncWrite};
use hyper::client::connect::{Connected, Connection};
use send_wrapper::SendWrapper;

struct UnixStreamInner {
    pub inner: compio::net::UnixStream,
}

impl UnixStreamInner {
    pub async fn connect(uri: impl AsRef<Path>) -> io::Result<Self> {
        compio::net::UnixStream::connect(uri)
            .and_then(|unix_stream| Ok(UnixStreamInner { inner: unix_stream }))
    }
}

impl AsyncRead for UnixStreamInner {
    async fn read<B: IoBufMut>(&mut self, buf: B) -> BufResult<usize, B> {
        self.inner.read(buf).await
    }

    async fn read_vectored<V: IoVectoredBufMut>(&mut self, buf: V) -> BufResult<usize, V> {
        self.inner.read_vectored(buf).await
    }
}

impl AsyncWrite for UnixStreamInner {
    async fn write<T: IoBuf>(&mut self, buf: T) -> BufResult<usize, T> {
        self.inner.write(buf).await
    }

    async fn write_vectored<T: IoVectoredBuf>(&mut self, buf: T) -> BufResult<usize, T> {
        self.inner.write_vectored(buf).await
    }

    async fn flush(&mut self) -> io::Result<()> {
        self.inner.flush().await
    }

    async fn shutdown(&mut self) -> io::Result<()> {
        self.inner.shutdown().await
    }
}

type PinBoxFuture<T> = Pin<Box<dyn Future<Output = T> + Send>>;

/// A Unix Domain Socket stream wrapper, based on compio, and exposes [`tokio::io`]
/// interfaces.
pub struct UnixStream {
    inner: SendWrapper<SyncStream<UnixStreamInner>>,
    read_future: Option<PinBoxFuture<io::Result<usize>>>,
    write_future: Option<PinBoxFuture<io::Result<usize>>>,
    shutdown_future: Option<PinBoxFuture<io::Result<()>>>,
}

impl UnixStream {
    /// Create [`HttpStream`] with target uri and TLS backend.
    pub async fn connect(uri: impl AsRef<Path>) -> io::Result<Self> {
        Ok(Self::from_inner(UnixStreamInner::connect(uri).await?))
    }

    fn from_inner(s: UnixStreamInner) -> Self {
        Self {
            inner: SendWrapper::new(SyncStream::new(s)),
            read_future: None,
            write_future: None,
            shutdown_future: None,
        }
    }
}

macro_rules! poll_future {
    ($f:expr, $cx:expr, $e:expr) => {{
        let mut future = match $f.take() {
            Some(f) => f,
            None => Box::pin(SendWrapper::new($e)),
        };
        let f = future.as_mut();
        match f.poll($cx) {
            Poll::Pending => {
                $f = Some(future);
                return Poll::Pending;
            }
            Poll::Ready(res) => res,
        }
    }};
}

macro_rules! poll_future_would_block {
    ($f:expr, $cx:expr, $e:expr, $io:expr) => {{
        if let Some(mut f) = $f.take() {
            if f.as_mut().poll($cx).is_pending() {
                $f = Some(f);
                return Poll::Pending;
            }
        }

        match $io {
            Ok(len) => Poll::Ready(Ok(len)),
            Err(e) if e.kind() == io::ErrorKind::WouldBlock => {
                $f = Some(Box::pin(SendWrapper::new($e)));
                $cx.waker().wake_by_ref();
                Poll::Pending
            }
            Err(e) => Poll::Ready(Err(e)),
        }
    }};
}

#[inline]
fn read_buf(reader: &mut impl io::Read, buf: &mut tokio::io::ReadBuf<'_>) -> io::Result<()> {
    let slice = buf.initialize_unfilled();
    let len = reader.read(slice)?;
    buf.advance(len);
    Ok(())
}

impl tokio::io::AsyncRead for UnixStream {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut tokio::io::ReadBuf<'_>,
    ) -> Poll<io::Result<()>> {
        let inner: &'static mut SyncStream<UnixStreamInner> =
            unsafe { &mut *(self.inner.deref_mut() as *mut _) };

        poll_future_would_block!(
            self.read_future,
            cx,
            inner.fill_read_buf(),
            read_buf(inner, buf)
        )
    }
}

impl tokio::io::AsyncWrite for UnixStream {
    fn poll_write(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<io::Result<usize>> {
        let inner: &'static mut SyncStream<UnixStreamInner> =
            unsafe { &mut *(self.inner.deref_mut() as *mut _) };

        poll_future_would_block!(
            self.write_future,
            cx,
            inner.flush_write_buf(),
            io::Write::write(inner, buf)
        )
    }

    fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        let inner: &'static mut SyncStream<UnixStreamInner> =
            unsafe { &mut *(self.inner.deref_mut() as *mut _) };
        let res = poll_future!(self.write_future, cx, inner.flush_write_buf());
        Poll::Ready(res.map(|_| ()))
    }

    fn poll_shutdown(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        let inner: &'static mut SyncStream<UnixStreamInner> =
            unsafe { &mut *(self.inner.deref_mut() as *mut _) };
        let res = poll_future!(self.shutdown_future, cx, inner.get_mut().shutdown());
        Poll::Ready(res)
    }
}

impl Connection for UnixStream {
    fn connected(&self) -> Connected {
        Connected::new()
    }
}
