use crate::kafka::message::Message;
use kafka::client::{FetchPartition, KafkaClient, ProduceMessage, RequiredAcks};
use kafka::consumer::FetchOffset;
use log::{debug, info, error};
use serde_json::{json, Value};
use std::time::Duration;

mod connection;
mod message;

#[tauri::command]
pub fn topics(hosts: &str) -> Value {
    info!("获取 Kafka 主题列表，hosts: {}", hosts);
    let broker = hosts
        .split(",")
        .map(|s| s.to_string())
        .collect::<Vec<String>>();
    debug!("解析的 broker 列表: {:?}", broker);
    let mut client = KafkaClient::new(broker);
    client
        .load_metadata_all()
        .unwrap_or_else(|e| {
            error!("加载 Kafka 元数据失败: {:?}", e);
            println!("load metadata failed when topics")
        });
    debug!("topics: {:?}", client.topics());
    let mut topics = vec![];
    for topic in client.topics() {
        let name = topic.name().to_string();
        topics.push(name);
    }
    info!("成功获取 {} 个主题", topics.len());
    json!(topics)
}

#[test]
fn topics_test() {
    let value = topics("kafka08-test.mars.ljnode.com:9092,kafka09-test.mars.ljnode.com:9092,kafka10-test.mars.ljnode.com:9092");
    println!("topics test result: {:?}", value);
}

#[tauri::command]
pub fn send_message(hosts: &str, topic: &str, data: &str) {
    info!("发送 Kafka 消息，hosts: {}, topic: {}", hosts, topic);
    debug!("消息内容: {}", data);
    let broker = hosts
        .split(",")
        .map(|s| s.to_string())
        .collect::<Vec<String>>();
    debug!("解析的 broker 列表: {:?}", broker);
    let mut client = KafkaClient::new(broker);
    client
        .load_metadata_all()
        .unwrap_or_else(|e| {
            error!("加载 Kafka 元数据失败: {:?}", e);
            println!("load metadata failed when send message")
        });
    let req = vec![ProduceMessage::new(topic, 0, None, Some(data.as_bytes()))];
    debug!("创建消息请求: topic={}, partition=0, data_len={}", topic, data.len());
    let resp = client.produce_messages(RequiredAcks::One, Duration::from_millis(100), req);
    match &resp {
        Ok(_) => info!("Kafka 消息发送成功"),
        Err(e) => error!("Kafka 消息发送失败: {:?}", e),
    }
    debug!("发送响应: {:?}", resp);
}

#[tauri::command]
pub fn fetch_message(hosts: &str, topic: &str) -> Value {
    info!("获取 Kafka 消息，hosts: {}, topic: {}", hosts, topic);
    let broker = hosts
        .split(",")
        .map(|s| s.to_string())
        .collect::<Vec<String>>();
    debug!("解析的 broker 列表: {:?}", broker);
    let mut client = KafkaClient::new(broker);
    client
        .load_metadata_all()
        .unwrap_or_else(|e| {
            error!("加载 Kafka 元数据失败: {:?}", e);
            println!("load metadata failed when fetch message")
        });
    let topic_offset = client.fetch_topic_offsets(topic, FetchOffset::Latest);
    let mut reqs = vec![];

    match &topic_offset {
        Ok(offsets) => {
            debug!("获取主题偏移量成功: {:?}", offsets);
            offsets.iter().for_each(|p| {
                let offset = p.offset - 33;
                debug!("创建分区请求: topic={}, partition={}, offset={}", topic, p.partition, offset);
                reqs.push(FetchPartition::new(topic, p.partition, offset));
            });
        }
        Err(e) => {
            error!("获取主题偏移量失败: {:?}", e);
            return json!([]);
        }
    }

    let result = client.fetch_messages(reqs);
    match &result {
        Ok(_) => info!("获取消息请求成功"),
        Err(e) => {
            error!("获取消息请求失败: {:?}", e);
            return json!([]);
        }
    }
    
    let mut messages: Vec<Message> = vec![];
    let resps = result.unwrap();
    debug!("获取到 {} 个响应", resps.len());
    
    for resp in &resps {
        for t in resp.topics() {
            debug!("处理主题: {}", t.topic());
            for p in t.partitions() {
                match p.data() {
                    Err(ref e) => {
                        error!("分区错误: topic={}, partition={}, error={}", t.topic(), p.partition(), e);
                        println!("partition error: {}:{}: {}", t.topic(), p.partition(), e)
                    }
                    Ok(ref data) => {
                        debug!("分区数据: topic={}, partition={}, messages_count={}", t.topic(), p.partition(), data.messages().len());
                        for msg in data.messages() {
                            debug!("收到消息: offset={}, key_len={}, value_len={}", msg.offset, msg.key.len(), msg.value.len());
                            println!("received message: {:?}", msg);
                            messages.push(msg.into())
                        }
                    }
                }
            }
        }
    }
    info!("成功获取 {} 条消息", messages.len());
    json!(messages)
}

#[test]
fn fetch_message_test() {
    let value = fetch_message("kafka08-test.mars.ljnode.com:9092,kafka09-test.mars.ljnode.com:9092,kafka10-test.mars.ljnode.com:9092", "wekehome-leonis-robot-callback");
    println!("fetch_message test result: {}", value);
}
