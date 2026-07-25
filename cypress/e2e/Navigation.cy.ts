describe('Navigation', () => {
  describe('Static pages', () => {
    it('should navigate between the about and blog pages via the nav bar', () => {
      // The board (index page) is self-contained and has no nav bar, so
      // navigation can only be exercised starting from a Main-wrapped page.
      cy.visit('/about');

      // Main renders the app title as an h1
      cy.findByRole('heading', { name: 'Money Spending Board' });

      // Find a link containing "Blog" text and click it
      cy.findByRole('link', { name: 'Blog' }).click();

      // The new url should include "/blog"
      cy.url().should('include', '/blog');
    });

    it('should take screenshot of the homepage', () => {
      cy.visit('/');

      // The board renders a transient loading state on mount before
      // settling into auth/config/app content — wait it out so the
      // snapshot doesn't race the boot sequence.
      cy.contains(/Loading…|กำลังโหลด/).should('not.exist');

      cy.percySnapshot('Homepage');
    });

    it('should take screenshot of the About page', () => {
      cy.visit('/about');

      // Wait until the page is displayed
      cy.findByRole('link', { name: 'About' });

      cy.percySnapshot('About');
    });
  });
});
