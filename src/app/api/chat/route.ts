import { NextResponse } from 'next/server';
import { askMetagent } from '../../../agent';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, tableFQN } = body;
        
        // We can pass a specific table from the frontend, or default to one for testing
        const target = tableFQN || "local_mysql.openmetadata_db.openmetadata_db.ACT_HI_PROCINST";
        
        const response = await askMetagent(message, target);
        
        return NextResponse.json({ reply: response });
    } catch (error) {
        return NextResponse.json({ reply: "🚨 Server Error: Could not reach Metagent." }, { status: 500 });
    }
}