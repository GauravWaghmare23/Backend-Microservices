const amqp = require('amqplib');
const logger = require('./logger.js');

let channel = null;
let connection = null;

const EXCHANGE_NAME = 'facebook_events';

async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false }); 
        logger.info('Connected to RabbitMQ');
        return channel;
    } catch (error) {
        logger.error(`Error connecting to RabbitMQ: ${error.message}`);
    }
}

module.exports = { connectRabbitMQ };