import { render, screen } from '@testing-library/react';

import Blog from './page';

describe('Blog page', () => {
  describe('Render method', () => {
    it('should display the last 10 posts', () => {
      render(<Blog />);

      const link = screen.getAllByRole('link', {
        name: /Blog -/,
      });

      expect(link).toHaveLength(10);
    });
  });
});
