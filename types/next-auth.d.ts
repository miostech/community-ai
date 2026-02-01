import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
    interface User {
        id?: string;
        auth_user_id?: string;
    }

    interface Session {
        user: {
            id?: string;
            auth_user_id?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        auth_user_id?: string;
    }
}
