const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kbtpayhzcgivgimvbyqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidHBheWh6Y2dpdmdpbXZieXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjUxOTIsImV4cCI6MjA4MDgwMTE5Mn0.HdI8IXRE0r4eNPDTsM7IS4H0-Dg1bGPuuZSg1rXFRrw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePassword() {
    const email = 'cristoviveforms@gmail.com';
    // We found out this was the working password in the previous step
    const currentWorkingPassword = 'Mvc123456';
    const newPassword = 'mcv123456';

    console.log(`Logging in with current password: ${currentWorkingPassword}...`);
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: currentWorkingPassword,
    });

    if (loginError) {
        console.error('Failed to login with current password:', loginError.message);
        // If login fails, maybe they already changed it? Let's try to login with the new one just in case.
        console.log(`Trying to login with NEW password: ${newPassword}...`);
        const { error: newLoginError } = await supabase.auth.signInWithPassword({
            email,
            password: newPassword,
        });
        if (!newLoginError) {
            console.log('User is ALREADY using the new password.');
            return;
        }
        console.error('Could not access account to update password.');
        return;
    }

    console.log('Login successful. Updating password...');
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (updateError) {
        console.error('Failed to update password:', updateError.message);
    } else {
        console.log('Password updated successfully to:', newPassword);
    }
}

updatePassword();
