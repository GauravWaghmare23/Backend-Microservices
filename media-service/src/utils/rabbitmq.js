const amqp = require("amqplib");
const logger = require("./logger.js");
const { json } = require("express");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);

    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

    logger.info("Connected to RabbitMQ");

    return channel;
  } catch (error) {
    logger.error(`Error connecting to RabbitMQ: ${error.message}`);
  }
}

async function publishEvent(eventName, eventData) {
  try {
    if (!channel) {
      await connectRabbitMQ();
    }

    const published = channel.publish(
      EXCHANGE_NAME,
      eventName,
      Buffer.from(JSON.stringify(eventData))
    );

    if (!published) {
      logger.warn(`Event not published: ${eventName}`);
    }

    logger.info(`Event published: ${eventName}`);
  } catch (error) {
    logger.error(`Error publishing event: ${err.message}`);
  }
}

async function consumeEvent(eventName, callback) {
  try {
    if (!channel) {
      await connectRabbitMQ();
    }

    const q = await channel.assertQueue("", { exclusive: true });

    await channel.bindQueue(q.queue, EXCHANGE_NAME, eventName);

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        channel.ack(msg);
      }

      
    });
      logger.info(`subscribed to event: ${eventName}`);
  } catch (error) {
    logger.error(`Error consuming event: ${err.message}`);
  }
}

module.exports = { connectRabbitMQ, consumeEvent ,publishEvent};
