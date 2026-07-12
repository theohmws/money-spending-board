import { render, screen } from '@testing-library/react';

import About from './page';

describe('About page', () => {
  describe('Render method', () => {
    it('should have a link to creativedesignsguru.com', () => {
      render(<About />);

      const link = screen.getByRole('link', { name: 'CreativeDesignsGuru' });

      expect(link).toHaveAttribute('href', 'https://creativedesignsguru.com');
    });
  });
});
