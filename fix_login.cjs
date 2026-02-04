const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kbtpayhzcgivgimvbyqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidHBheWh6Y2dpdmdpbXZieXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjUxOTIsImV4cCI6MjA4MDgwMTE5Mn0.HdI8IXRE0r4eNPDTsM7IS4H0-Dg1bGPuuZSg1rXFRrw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLogin() {
    const email = 'cristoviveforms@gmail.com';
    const targetPassword = 'mcv123456';
    const legacyPasswords = ['Mvc123456', '@cristovive', '123456'];

    console.log(`[1/4] Checking if target password works...`);
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: targetPassword,
    });

    if (!loginError && sessionData.session) {
        console.log('✅ Success: User already exists and password is correct!');
        return;
    }

    console.log(`❌ Target password failed. Checking legacy passwords...`);

    for (const oldPwd of legacyPasswords) {
        console.log(`[2/4] Trying legacy password: ${oldPwd}...`);
        const { data: oldSessionData, error: oldLoginError } = await supabase.auth.signInWithPassword({
            email,
            password: oldPwd,
        });

        if (!oldLoginError && oldSessionData.session) {
            console.log(`✅ Success: Logged in with legacy password: ${oldPwd}`);
            console.log(`[3/4] Updating to target password...`);
            const { error: updateError } = await supabase.auth.updateUser({
                password: targetPassword
            });
            if (updateError) {
                console.error('❌ Failed to update password:', updateError.message);
            } else {
                console.log('✅ Password updated successfully!');
            }
            return;
        }
    }

    console.log(`❌ No passwords worked. Attempting to create new user...`);
    console.log(`[4/4] Creating user ${email}...`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: targetPassword,
    });

    if (signUpError) {
        console.error('❌ Sign up failed:', signUpError.message);
        // Special case: User exists but maybe confirmed via different method or blocked?
        if (signUpError.message.includes("User already registered")) {
             console.log("⚠️ User exists but we couldn't log in. This might need a password reset email or admin intervention.");
        }
    } else {
        console.log('✅ Sign up initiated.');
        if (signUpData.session) {
            console.log('✅ User created and logged in immediately.');
        } else {
            console.log('✅ User created! CONFIRMATION EMAIL SENT. Please check inbox.');
        }
    }
}

fixLogin();
