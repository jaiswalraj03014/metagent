import { askMetagent } from './agent';

async function run() {
    // For local Docker, OpenMetadata usually has some sample data pre-loaded.
    // 'sample_data.ecommerce_db.shopify.raw_customer' is a common default table.
    const targetTable = "local_mysql.openmetadata_db.openmetadata_db.user_entity";
    
    const question = "Which column should I use to find the customer's email address, and what data type is it?";

    console.log(`\n🗣️  User: ${question}`);
    
    const answer = await askMetagent(question, targetTable);
    
    console.log(`\n🤖 Metagent:\n${answer}\n`);
}

run();