import { getRequestContext } from '@cloudflare/next-on-pages';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { createUser, getUserById } from './user';



export const { handlers, auth, signIn, signOut } = NextAuth(req => {
    const { env } = getRequestContext();

    // Log auth configuration (excluding secrets)
    // console.log('🔐 Auth Configuration: ', {
    //     authUrl: env.AUTH_URL,
    //     apiBaseUrl: env.API_BASE_URL,
    //     hasGoogleClientId: env.GOOGLE_CLIENT_ID,
    //     hasGoogleClientSecret: env.GOOGLE_CLIENT_SECRET,
    //     hasAuthSecret: env.AUTH_SECRET
    // });

    return {
        secret: env.AUTH_SECRET,
        session: { strategy: 'jwt' },
        providers: [
            Google({
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
                authorization: {
                    params: {
                        prompt: "consent",
                        access_type: "offline",
                        response_type: "code"
                    }
                }
            }),
        ],
        callbacks: {
            async signIn({ user, account, profile }) {
                try {
                    if (account?.provider === 'google') {
                        if (!profile) {
                            console.error('❌ Sign in failed: No profile data received from Google');
                            return false;
                        }

                        console.log('👤 Attempting sign in for:', {
                            email: profile.email,
                            provider: account.provider,
                            profileReceived: !!profile
                        });

                        const existingUser = await getUserById(profile.sub as string);
                        if (!existingUser) {
                            console.log('📝 Creating new user:', profile.email);
                            const newUser = {
                                id: profile.sub as string,
                                name: profile.name as string,
                                email: profile.email as string,
                                image: profile.picture as string,
                            };
                            await createUser(newUser);

                            console.log('✨ Creating default contact list for new user...');
                            const db = getRequestContext().env.CASTFORM_DB;
                            const now = new Date().toISOString();
                            const defaultListName = 'My Contact List';
                            const defaultListDesc = 'A default list for your contacts.';

                            await db.prepare(
                                'INSERT INTO ContactLists (name, description, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
                            ).bind(defaultListName, defaultListDesc, newUser.id, now, now).run();
                            console.log('✅ Default contact list created successfully.');
                        }
                    }
                    return true;
                } catch (error) {
                    console.error('❌ Sign in error:', error instanceof Error ? error.message : 'Unknown error');
                    return false;
                }
            },
            async jwt({ token, user, account, profile }) {
                if (account && profile) {
                    token.id = profile.sub; // 👈 Store Google ID in token
                    token.email = profile.email;
                    token.name = profile.name;
                    token.picture = profile.picture;
                    token.role = (user as any)?.role ?? 'user'; // Optional default
                }
                return token;
            },

            async session({ session, token }) {
                if (token.id && session.user) {
                    session.user.id = token.id as string;
                    const user = await getUserById(token.id as string);
                    if (user) {
                        (session.user as any).subscription_status = user.subscription_status;
                        (session.user as any).can_make_calls = user.can_make_calls;
                    }
                }
                return session;
            }
        },
        debug: env.NODE_ENV === 'development',
        pages: {
            signIn: '/auth/signin',
            error: '/auth/error',
        }
    }
}); 