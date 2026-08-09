import { NextResponse } from "next/server";
import { db } from "@/db";
import { wallets, walletTransactions, bonusTransactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ wallet: null, transactions: [] });

  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1);
  if (!wallet) return NextResponse.json({ wallet: null, transactions: [] });

  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.id))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(30);

  const bonusHistory = await db
    .select()
    .from(bonusTransactions)
    .where(eq(bonusTransactions.userId, user.id))
    .orderBy(desc(bonusTransactions.createdAt))
    .limit(30);

  return NextResponse.json({ wallet, transactions, bonusHistory });
}
