import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils';

export function withAuth(handler: (req: NextRequest, context: any, user: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context: any) => {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { message: 'Authorization token required' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const user = verifyToken(token);
      
      return handler(req, context, user);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  };
}

export function withRole(allowedRoles: string[]) {
  return function (handler: (req: NextRequest, context: any, user: any) => Promise<NextResponse>) {
    return withAuth(async (req: NextRequest, context: any, user: any) => {
      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { message: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      
      return handler(req, context, user);
    });
  };
}