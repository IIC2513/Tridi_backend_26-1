const { createClient } = require('@supabase/supabase-js');
const { User } = require('../models');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const express = require('express');
const app = express();
app.use(express.json());

const supabase = createClient(supabaseUrl, supabaseKey);
app.post('/', async (req, res) => {
    const {email, username, password, image, providerToken} = req.body;

    let user, created;
    try {
        if (providerToken) {
            const { data, error } = await supabase.auth.getUser(providerToken);
            if (error)
                return res.status(error.status).json({ error: error.message });

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

            [user, created] = await User.findOrCreate({
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
        } else {
            if (!email || !password)
                return res.status(400).json({ error: 'Email and password are required' });

            const user = await User.findOne({ where: { email } });
            if (!user)
                return res.status(401).json({ error: 'Invalid email or password' });

            const valid = await user.comparePassword(password);
            if (!valid)
                return res.status(401).json({ error: 'Invalid email or password' });
        }

        delete user.dataValues.password;
        return res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
