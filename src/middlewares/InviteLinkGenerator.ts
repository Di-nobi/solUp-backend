import crypto from 'crypto';

export const generateInviteLink = (groupId: string): string => {
    const uniqueToken = crypto.randomBytes(16).toString('hex');
    const baseUrl: any = process.env.BASE_URL; // Base IP
    const protocol = /^https?:\/\//.test(baseUrl) ? '' : 'http://';
    return `${protocol}${baseUrl}/group/join-group/${groupId}/${uniqueToken}`;

}