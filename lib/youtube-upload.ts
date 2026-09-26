const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

async function getAccessToken(): Promise<string> {
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.YOUTUBE_CLIENT_ID!,
            client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
            refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!,
            grant_type: 'refresh_token',
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Falha ao obter access token: ${res.status} ${body}`);
    }
    const data = await res.json();
    return data.access_token;
}

export async function uploadToYouTube(
    videoUrl: string,
    title: string,
    description: string
): Promise<string> {
    const accessToken = await getAccessToken();

    const initRes = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': 'video/mp4',
        },
        body: JSON.stringify({
            snippet: { title, description, categoryId: '22' },
            status: { privacyStatus: 'unlisted', selfDeclaredMadeForKids: false },
        }),
    });

    if (!initRes.ok) {
        const body = await initRes.text();
        throw new Error(`Falha ao iniciar upload resumable: ${initRes.status} ${body}`);
    }

    const uploadUri = initRes.headers.get('location');
    if (!uploadUri) throw new Error('YouTube não retornou URI de upload');

    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok || !videoRes.body) {
        throw new Error(`Falha ao baixar vídeo do Azure: ${videoRes.status}`);
    }

    const uploadRes = await fetch(uploadUri, {
        method: 'PUT',
        headers: { 'Content-Type': 'video/mp4' },
        body: videoRes.body,
        // @ts-expect-error Node fetch supports duplex
        duplex: 'half',
    });

    if (!uploadRes.ok) {
        const body = await uploadRes.text();
        throw new Error(`Falha no upload do vídeo: ${uploadRes.status} ${body}`);
    }

    const result = await uploadRes.json();
    return `https://www.youtube.com/watch?v=${result.id}`;
}
