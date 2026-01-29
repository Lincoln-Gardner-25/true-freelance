/**
 * Auth Guard - Protect pages that require authentication
 * Redirects to login if no valid session exists
 */

(async function() {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }

    // Expose current user globally
    window.currentUser = session.user;
})();
