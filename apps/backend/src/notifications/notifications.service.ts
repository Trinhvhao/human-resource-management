import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(createNotificationDto: CreateNotificationDto) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: createNotificationDto.userId,
                title: createNotificationDto.title,
                message: createNotificationDto.message,
                type: createNotificationDto.type || 'INFO',
                link: createNotificationDto.link,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        employee: {
                            select: {
                                fullName: true,
                            },
                        },
                    },
                },
            },
        });

        return {
            success: true,
            message: 'Notification created successfully',
            data: notification,
        };
    }

    async createBulk(notifications: CreateNotificationDto[]) {
        const created = await this.prisma.notification.createMany({
            data: notifications.map((n) => ({
                userId: n.userId,
                title: n.title,
                message: n.message,
                type: n.type || 'INFO',
                link: n.link,
            })),
        });

        return {
            success: true,
            message: `Created ${created.count} notifications`,
            data: { count: created.count },
        };
    }

    async findAll(userId: string, unreadOnly: boolean = false) {
        const where: any = { userId };
        if (unreadOnly) {
            where.isRead = false;
        }

        const notifications = await this.prisma.notification.findMany({
            where,
            select: {
                id: true,
                title: true,
                type: true,
                isRead: true,
                createdAt: true,
                link: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to 50 most recent
        });

        return {
            success: true,
            data: notifications,
        };
    }

    async getUnreadCount(userId: string) {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        return {
            success: true,
            data: { count },
        };
    }

    async markAsRead(id: string, userId: string) {
        const notification = await this.prisma.notification.updateMany({
            where: {
                id,
                userId, // Ensure user owns this notification
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        if (notification.count === 0) {
            return {
                success: false,
                message: 'Notification not found or access denied',
            };
        }

        return {
            success: true,
            message: 'Notification marked as read',
        };
    }

    async markAllAsRead(userId: string) {
        const result = await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return {
            success: true,
            message: `Marked ${result.count} notifications as read`,
            data: { count: result.count },
        };
    }

    async delete(id: string, userId: string) {
        const result = await this.prisma.notification.deleteMany({
            where: {
                id,
                userId, // Ensure user owns this notification
            },
        });

        if (result.count === 0) {
            return {
                success: false,
                message: 'Notification not found or access denied',
            };
        }

        return {
            success: true,
            message: 'Notification deleted',
        };
    }

    async deleteAll(userId: string) {
        const result = await this.prisma.notification.deleteMany({
            where: { userId },
        });

        return {
            success: true,
            message: `Deleted ${result.count} notifications`,
            data: { count: result.count },
        };
    }

    // Helper method to send notification to user
    async notifyUser(
        userId: string,
        title: string,
        message: string,
        type: string = 'INFO',
        link?: string,
    ) {
        return this.create({
            userId,
            title,
            message,
            type: type as any,
            link,
        });
    }

    // Helper method to send notification to multiple users
    async notifyUsers(
        userIds: string[],
        title: string,
        message: string,
        type: string = 'INFO',
        link?: string,
    ) {
        const notifications = userIds.map((userId) => ({
            userId,
            title,
            message,
            type: type as any,
            link,
        }));

        return this.createBulk(notifications);
    }
}
