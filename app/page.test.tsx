import { fireEvent, render, screen } from '@testing-library/react';

import Index from './page';

const mockSession = {
  user: { email: 'demo@example.com', id: 'user-1' },
};

const mockAuth = {
  getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  }),
  signInWithPassword: jest
    .fn()
    .mockResolvedValue({ data: { session: mockSession }, error: null }),
  signUp: jest
    .fn()
    .mockResolvedValue({ data: { session: mockSession }, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
};

const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  insert: jest.fn(() => ({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  delete: jest.fn(() => ({
    eq: jest.fn().mockResolvedValue({ error: null }),
  })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: mockAuth, from: mockFrom })),
}));

describe('Index page', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
  });

  describe('Render method', () => {
    it('should show the sign-in screen once booting settles', async () => {
      render(<Index />);

      expect(await screen.findByLabelText('อีเมล')).toBeInTheDocument();
      expect(screen.getByLabelText('รหัสผ่าน')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'เข้าสู่ระบบ' })
      ).toBeInTheDocument();
    });

    it('should sign in against the configured Supabase project and show the dashboard', async () => {
      render(<Index />);

      fireEvent.change(await screen.findByLabelText('อีเมล'), {
        target: { value: 'demo@example.com' },
      });
      fireEvent.change(screen.getByLabelText('รหัสผ่าน'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));

      expect(await screen.findByText('กิจกรรมล่าสุด')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /เพิ่มรายการ/ })
      ).toBeInTheDocument();
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'demo@example.com',
        password: 'password123',
      });

      fireEvent.click(screen.getByRole('button', { name: 'EN' }));

      expect(screen.getByText('Recent activity')).toBeInTheDocument();
    });
  });

  describe('when Supabase env vars are missing', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    afterEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });

    it('shows a config-missing message instead of the sign-in screen', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      render(<Index />);

      expect(
        await screen.findByText(/NEXT_PUBLIC_SUPABASE_URL/)
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('อีเมล')).not.toBeInTheDocument();
    });
  });
});
