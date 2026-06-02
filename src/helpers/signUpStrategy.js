const { User } = require('../models');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function signUp(body) {
    const { providerToken } = body;

    let user, created, error;
    if (providerToken) {
        [user, created, error] = await signUpWithSupaBase(providerToken);
    } else {
        [user, created, error] = await normalSignUp(body);
    }

    return [user, created, error];
}

async function normalSignUp(body) {
    const { email, username, password, image } = body;

    if (!email || !username || !password)
        return [null, null, {
            message: 'Email, username and password are required',
            status: 400
        }];

    const [user, created] = await User.findOrCreate({
        where: { email },
        defaults: {
            username,
            email,
            password,
            image: image || null,
            role: 'user',
            seller: false,
        }
    });

    return [user, created, null];
}
async function signUpWithSupaBase(providerToken) {
    const { data, error } = await supabase.auth.getUser(providerToken);

    if (error)
        return [null, null, error];

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

    const [user, created] = await User.findOrCreate({
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

    return [user, created, null];
}

module.exports = { signUp };
