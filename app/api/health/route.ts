import { NextResponse } from 'next/server';

// Rota de health check para warm-up do Azure Static Web Apps
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
