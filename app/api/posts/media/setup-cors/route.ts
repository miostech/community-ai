import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';

export const dynamic = 'force-dynamic';

const AZURE_CONNECTION_STRING = (process.env.AZURE_STORAGE_CONNECTION_STRING || '').trim();

// GET - Configurar CORS no Azure Storage (rodar uma vez)
export async function GET() {
    try {
        if (!AZURE_CONNECTION_STRING) {
            return NextResponse.json({ error: 'Connection string não configurada' }, { status: 500 });
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_CONNECTION_STRING);

        // Configurar CORS para permitir upload direto do navegador
        await blobServiceClient.setProperties({
            cors: [
                {
                    allowedOrigins: '*', // Em produção, especifique os domínios
                    allowedMethods: 'GET,PUT,POST,DELETE,HEAD,OPTIONS',
                    allowedHeaders: '*',
                    exposedHeaders: '*',
                    maxAgeInSeconds: 3600,
                },
            ],
        });

        return NextResponse.json({
            success: true,
            message: 'CORS configurado com sucesso no Azure Storage',
        });

    } catch (error) {
        console.error('Erro ao configurar CORS:', error);
        return NextResponse.json({ 
            error: 'Erro ao configurar CORS',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
    }
}
