use kafka::client::{FetchPartition, KafkaClient, ProduceMessage, RequiredAcks};
use log::debug;
use std::time::Duration;
use serde_json::{json, Value};
use crate::kafka::message::Message;

mod message;
mod connection;

#[tauri::command]
pub fn topics(hosts: &str) -> Value {
    debug!("hosts: {}", hosts);
    let mut client = KafkaClient::new(vec![hosts.to_string()]);
    client.load_metadata_all().unwrap_or_else(|_| println!("load metadata failed when topics"));
    debug!("{:?}", client.topics());
    let mut topics = vec![];
    for topic in client.topics() {
        let name = topic.name().to_string();
        topics.push(name);
    }
    json!(topics)
}

#[tauri::command]
pub fn send_message(hosts: &str, topic: &str, data: &str) {
    debug!("hosts: {}, topic: {}, data: {}", hosts, topic, data);
    let mut client = KafkaClient::new(vec![hosts.to_string()]);
    client.load_metadata_all().unwrap_or_else(|_| println!("load metadata failed when send message"));
    let req = vec![ProduceMessage::new(topic, 0, None, Some(data.as_bytes()))];
    let resp = client.produce_messages(RequiredAcks::One, Duration::from_millis(100), req);
    debug!("{:?}", resp);
}

#[tauri::command]
pub fn fetch_message(hosts: &str, topic: &str) -> Value {
    debug!("hosts: {}, topic: {}", hosts, topic);
    let mut client = KafkaClient::new(vec![hosts.to_string()]);
    client.load_metadata_all().unwrap_or_else(|_| println!("load metadata failed when fetch message"));
    let reqs = &[FetchPartition::new(topic, 0, 0)];
    let result = client.fetch_messages(reqs);
    debug!("hosts: {}, topic: {}, result: {:?}", hosts, topic, result);
    let mut messages: Vec<Message> = vec![];
    let resps = result.unwrap();
    for resp in &resps {
        for t in resp.topics() {
            for p in t.partitions() {
                match p.data() {
                    Err(ref e) => {
                        println!("partition error: {}:{}: {}", t.topic(), p.partition(), e)
                    }
                    Ok(ref data) => {
                        for msg in data.messages() {
                            messages.push(msg.into())
                        }
                    }
                }
            }
        }
    }
    json!(messages)
}