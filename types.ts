export interface Database {
    users: User[];
}

export interface User {
    id: number;
    walletAddress: string | null;
    funds: number;
    botActiveSince: string | null;
    invitationCode: number;
    invites: number[];
}