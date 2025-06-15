use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};

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
        Message {
            key: value.key,
            value: value.value,
            offset: value.offset,
        }
    }
}
impl<'a> From<&kafka::consumer::Message<'a>> for Message<'a> {
    fn from(value: &kafka::consumer::Message<'a>) -> Self {
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
        let mut state = serializer.serialize_struct("Message", 3)?;
        let key = String::from_utf8_lossy(self.key);
        state.serialize_field("key", &key)?;
        let value = String::from_utf8_lossy(self.value);
        state.serialize_field("value", &value)?;
        state.serialize_field("offset", &self.offset)?;
        state.end()
    }
}
