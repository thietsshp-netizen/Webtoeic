import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  const session = await getServerSession(authOptions) as any;
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { deviceId } = await params;

  try {
    const device = await prisma.userDevice.findUnique({
      where: { 
        userId_deviceId: {
          userId: session.user.id,
          deviceId: deviceId
        }
      }
    });

    if (!device) {
      return NextResponse.json({ error: 'Không tìm thấy thiết bị' }, { status: 404 });
    }

    // KIỂM TRA CHÍNH SÁCH 30 NGÀY (Chỉ áp dụng cho USER, ADMIN có quyền xóa mọi lúc)
    if (session.user.role !== 'ADMIN') {
      const userCreatedAt = session.user.createdAt ? new Date(session.user.createdAt) : new Date(device.createdAt);
      const ageInDays = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays > 30) {
        return NextResponse.json({ 
          error: 'Tài khoản của bạn đã vượt quá 30 ngày dùng thử thiết bị. Vui lòng liên hệ Admin để được hỗ trợ.' 
        }, { status: 403 });
      }
    }

    await prisma.userDevice.delete({
      where: {
        userId_deviceId: {
          userId: session.user.id,
          deviceId: deviceId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
