import 'dotenv/config';

const OM_URL = process.env.OM_URL;
const OM_JWT_TOKEN = process.env.OM_JWT_TOKEN;

/**
 * Fetches a specific table from OpenMetadata along with its column descriptions.
 */
export async function getTableContext(fullyQualifiedName: string) {
    if (!OM_URL || !OM_JWT_TOKEN) {
        throw new Error("Missing OpenMetadata credentials in .env");
    }

    try {
        // We ask the API to specifically include the 'columns' data
        const response = await fetch(
            `${OM_URL}/v1/tables/name/${fullyQualifiedName}?fields=columns`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OM_JWT_TOKEN}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch from OpenMetadata: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract just the useful parts for the AI (column names and what they mean)
        const columns = data.columns.map((col: any) => ({
            name: col.name,
            dataType: col.dataType,
            description: col.description || "No description provided."
        }));

        return {
            tableName: data.name,
            database: data.databaseSchema?.name,
            columns: columns
        };

    } catch (error) {
        console.error("OpenMetadata Client Error:", error);
        return null;
    }
}