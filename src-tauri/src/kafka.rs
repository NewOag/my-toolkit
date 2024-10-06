use kafka::client::{KafkaClient, ProduceMessage, RequiredAcks};
use std::time::Duration;

mod message;
mod connection;

const CLIENT: KafkaClient = KafkaClient::new(vec![]);

pub fn init_client(hosts: Vec<String>) {
    CLIENT = KafkaClient::new(hosts);
}

#[tauri::command]
pub fn send_message(topic: &str, data: &str) {
    CLIENT.load_metadata_all().unwrap();
    let req = vec![ProduceMessage::new(topic, 0, None, Some(data.as_bytes()))];
    let resp = CLIENT.produce_messages(RequiredAcks::One, Duration::from_millis(100), req);
    println!("{:?}", resp);
}

pub fn scan_message() {}