const { User } = require('../models');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function login(body) {
    const { providerToken } = body;

    if (providerToken) {
        return await loginWithSupaBase(providerToken);
    }
    return await normalLogin(body);
}

async function normalLogin(body) {
    const { email, password } = body;

    if (!email || !password)
        return [null, {
            message: 'Email and password are required',
            status: 400
        }];

    const user = await User.findOne({ where: { email } });
    if (!user)
        return [null, {
            message: 'Invalid email or password',
            status: 401
        }];

    const valid = await user.comparePassword(password);
    if (!valid)
        return [null, {
            message: 'Invalid email or password',
            status: 401
        }];

    return [user, null];
}

async function loginWithSupaBase(providerToken) {
    const { data, error } = await supabase.auth.getUser(providerToken);

    if (error)
        return [null, error];

    const supa_user = data.user;

    const username =
        supa_user.user_metadata?.username ||
        supa_user.user_metadata?.full_name ||
        supa_user.user_metadata?.name ||
        supa_user.email?.split('@')[0];

    const image =
        supa_user.user_metadata?.avatar_url ||
        supa_user.user_metadata?.picture ||
        null;

    const [user] = await User.findOrCreate({
        where: { email: supa_user.email },
        defaults: {
            username,
            email: supa_user.email,
            image,
            role: 'user',
            seller: false,
            externalId: supa_user.id
        }
    });

    return [user, null];
}

module.exports = { login };
