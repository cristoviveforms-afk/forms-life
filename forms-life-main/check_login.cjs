const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kbtpayhzcgivgimvbyqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidHBheWh6Y2dpdmdpbXZieXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjUxOTIsImV4cCI6MjA4MDgwMTE5Mn0.HdI8IXRE0r4eNPDTsM7IS4H0-Dg1bGPuuZSg1rXFRrw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogin() {
    const email = 'cristoviveforms@gmail.com';
    const newPassword = 'mcv123456';

    console.log(`Testing login with new password: ${newPassword}...`);
    let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
    });

    if (error) {
        console.log('Login failed with new password:', error.message);
    } else {
        console.log('Login SUCCESS with new password!');
    }
}

checkLogin();
