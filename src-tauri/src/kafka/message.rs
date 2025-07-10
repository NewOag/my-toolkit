use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};
use log::debug;

pub struct Message<'a> {
    /// The offset at which this message resides in the remote kafka
    /// broker topic partition.
    pub offset: i64,

    /// The "key" data of this message.  Empty if there is no such
    /// data for this message.
    pub key: &'a [u8],

    /// The value data of this message.  Empty if there is no such
    /// data for this message.
    pub value: &'a [u8],
}

impl<'a> From<kafka::client::fetch::Message<'a>> for Message<'a> {
    fn from(value: kafka::client::fetch::Message<'a>) -> Self {
        debug!("从 kafka::client::fetch::Message 转换: offset={}, key_len={}, value_len={}", 
               value.offset, value.key.len(), value.value.len());
        Message {
            key: value.key,
            value: value.value,
            offset: value.offset,
        }
    }
}

impl<'a> From<&kafka::consumer::Message<'a>> for Message<'a> {
    fn from(value: &kafka::consumer::Message<'a>) -> Self {
        debug!("从 &kafka::consumer::Message 转换: offset={}, key_len={}, value_len={}", 
               value.offset, value.key.len(), value.value.len());
        Message {
            key: value.key,
            value: value.value,
            offset: value.offset,
        }
    }
}

impl Serialize for Message<'_> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        debug!("序列化 Message: offset={}, key_len={}, value_len={}", 
               self.offset, self.key.len(), self.value.len());
        
        let mut state = serializer.serialize_struct("Message", 3)?;
        
        let key = String::from_utf8_lossy(self.key);
        debug!("序列化 key: {}", key);
        state.serialize_field("key", &key)?;
        
        let value = String::from_utf8_lossy(self.value);
        debug!("序列化 value: {}", value);
        state.serialize_field("value", &value)?;
        
        debug!("序列化 offset: {}", self.offset);
        state.serialize_field("offset", &self.offset)?;
        
        state.end()
    }
}
