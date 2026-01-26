3const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fqgepoacypohelxltzlb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxZ2Vwb2FjeXBvaGVseGx0emxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjE4NjMsImV4cCI6MjA4MDc5Nzg2M30.y-48XpAsp4ph65jy6uqt7lvstdZSXT_SLvqnsScG6P0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function manageAccess() {
    const email = 'cristoviveforms@gmail.com';
    const targetPassword = '@cristovive';

    // Potentially old passwords to try if direct login fails
    const oldPasswords = ['Mvc123456', 'mcv123456'];

    console.log(`Step 1: Trying to login with TARGET password...`);
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: targetPassword,
    });

    if (!loginError && sessionData.session) {
        console.log('SUCCESS: User already exists and password is correct!');
        return;
    }

    console.log('Login with target password failed. Checking if user exists with OLD passwords...');

    let loggedInSession = null;

    for (const oldPwd of oldPasswords) {
        console.log(`Trying password: ${oldPwd}...`);
        const { data: oldSessionData, error: oldLoginError } = await supabase.auth.signInWithPassword({
            email,
            password: oldPwd,
        });

        if (!oldLoginError && oldSessionData.session) {
            console.log(`SUCCESS: Logged in with old password: ${oldPwd}`);
            loggedInSession = oldSessionData.session;
            break;
        }
    }

    if (loggedInSession) {
        console.log('Step 2: Updating password to TARGET password...');
        const { error: updateError } = await supabase.auth.updateUser({
            password: targetPassword
        });

        if (updateError) {
            console.error('ERROR: Failed to update password:', updateError.message);
        } else {
            console.log('SUCCESS: Password updated to @cristovive');
        }
        return;
    }

    console.log('Step 3: No existing password worked. Attempting to SIGN UP new user...');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: targetPassword,
    });

    if (signUpError) {
        console.error('ERROR: Sign up failed:', signUpError.message);
    } else {
        console.log('SUCCESS: Sign up initiated.');
        if (signUpData.session) {
            console.log('User created and logged in immediately.');
        } else if (signUpData.user && !signUpData.session) {
            console.log('User created! Please check email for confirmation link if required by project settings.');
        }
    }
}

manageAccess();
