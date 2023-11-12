#![feature(ip_bits)]
use rand::{thread_rng, Rng};

const PRIVATE_IPV4_BASE: u32 = 0x0a << 24;
const PRIVATE_IPV6_BASE: u128 = 0xfd00_0000_0000_0000_0000_0000_0000_0000;

const IPV4_RANDOM_UPPER: u32 = (1 << 22) - 1;
const IPV6_RANDOM_UPPER: u128 = (1 << 118) - 1;

#[tauri::command]
pub fn generate_random_ipv4_local_30() -> String {
    let mut rng = thread_rng();
    let ipv4_generated_offset: u32 = rng.gen_range(0..IPV4_RANDOM_UPPER);
    let ipv4_generated = PRIVATE_IPV4_BASE + (ipv4_generated_offset << 2);

    let ipv4_address = std::net::Ipv4Addr::from_bits(ipv4_generated);

    format!("{}/30", ipv4_address)
}

#[tauri::command]
pub fn generate_random_ipv6_local_126() -> String {
    let mut rng = thread_rng();
    let ipv6_generated_offset: u128 = rng.gen_range(0..IPV6_RANDOM_UPPER);
    let ipv6_generated = PRIVATE_IPV6_BASE + (ipv6_generated_offset << 2);

    let ipv6_address = std::net::Ipv6Addr::from_bits(ipv6_generated);

    format!("{}/126", ipv6_address)
}
