use crate::kafka::message::Message;
use kafka::client::{FetchPartition, KafkaClient, ProduceMessage, RequiredAcks};
use kafka::consumer::FetchOffset;
use log::debug;
use serde_json::{json, Value};
use std::time::Duration;

mod connection;
mod message;

#[tauri::command]
pub fn topics(hosts: &str) -> Value {
    debug!("hosts: {}", hosts);
    let broker = hosts
        .split(",")
        .map(|s| s.to_string())
        .collect::<Vec<String>>();
    let mut client = KafkaClient::new(broker);
    client
        .load_metadata_all()
        .unwrap_or_else(|_| println!("load metadata failed when topics"));
    debug!("topics: {:?}", client.topics());
    let mut topics = vec![];
    for topic in client.topics() {
        let name = topic.name().to_string();
        topics.push(name);
    }
    json!(topics)
}

#[test]
fn topics_test() {
    let value = topics("kafka08-test.mars.ljnode.com:9092,kafka09-test.mars.ljnode.com:9092,kafka10-test.mars.ljnode.com:9092");
    println!("topics test result: {:?}", value);
}

#[tauri::command]
pub fn send_message(hosts: &str, topic: &str, data: &str) {
    debug!("hosts: {}, topic: {}, data: {}", hosts, topic, data);
    let broker = hosts
        .split(",")
        .map(|s| s.to_string())
        .collect::<Vec<String>>();
    let mut client = KafkaClient::new(broker);
    client
        .load_metadata_all()
        .unwrap_or_else(|_| println!("load metadata failed when send message"));
    let req = vec![ProduceMessage::new(topic, 0, None, Some(data.as_bytes()))];
    let resp = client.produce_messages(RequiredAcks::One, Duration::from_millis(100), req);
    debug!("{:?}", resp);
}

#[tauri::command]
pub fn fetch_message(hosts: &str, topic: &str) -> Value {
    println!("hosts: {}, topic: {}", hosts, topic);
    let broker = hosts
        .split(",")
        .map(|s| s.to_string())
        .collect::<Vec<String>>();
    let mut client = KafkaClient::new(broker);
    client
        .load_metadata_all()
        .unwrap_or_else(|_| println!("load metadata failed when fetch message"));
    let topic_offset = client.fetch_topic_offsets(topic, FetchOffset::Latest);
    let mut reqs = vec![];

    topic_offset
        .expect("topic offset error")
        .iter()
        .for_each(|p| {
            reqs.push(FetchPartition::new(topic, p.partition, p.offset - 33));
        });

    let result = client.fetch_messages(reqs);
    println!("hosts: {}, topic: {}", hosts, topic);
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
                            println!("received message: {:?}", msg);
                            messages.push(msg.into())
                        }
                    }
                }
            }
        }
    }
    json!(messages)
}

#[test]
fn fetch_message_test() {
    let value = fetch_message("kafka08-test.mars.ljnode.com:9092,kafka09-test.mars.ljnode.com:9092,kafka10-test.mars.ljnode.com:9092", "wekehome-leonis-robot-callback");
    println!("fetch_message test result: {}", value);
}
