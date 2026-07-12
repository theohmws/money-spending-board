import { fireEvent, render, screen } from '@testing-library/react';

import Index from './page';

describe('Index page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Render method', () => {
    it('should show the sign-in screen once booting settles', () => {
      render(<Index />);

      expect(screen.getByLabelText('อีเมล')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'เข้าสู่ระบบ' })
      ).toBeInTheDocument();
    });

    it('should show the demo-mode banner when no Supabase project is connected', () => {
      render(<Index />);

      expect(
        screen.getByText(/โหมดทดลอง/, { exact: false })
      ).toBeInTheDocument();
    });

    it('should sign in with demo mode and show the dashboard', () => {
      render(<Index />);

      fireEvent.change(screen.getByLabelText('อีเมล'), {
        target: { value: 'demo@example.com' },
      });
      fireEvent.change(screen.getByLabelText('รหัสผ่าน'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

      expect(screen.getByText('กิจกรรมล่าสุด')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /เพิ่มรายการ/ })
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'EN' }));

      expect(screen.getByText('Recent activity')).toBeInTheDocument();
    });
  });
});
