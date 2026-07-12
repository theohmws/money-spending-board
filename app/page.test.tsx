import { render, screen } from '@testing-library/react';

import Index from './page';

describe('Index page', () => {
  describe('Render method', () => {
    it('should have the needs/savings/wants split labels', () => {
      render(<Index />);

      expect(screen.getByText('ความจำเป็น 50%')).toBeInTheDocument();
      expect(screen.getByText('ออม 20%')).toBeInTheDocument();
      expect(screen.getByText('ความต้องการ 30%')).toBeInTheDocument();
    });
  });
});
