'use client'

import { useSession } from 'next-auth/react'
import UserInfo from "@/components/UserInfo";

export default function Test() {
    const { data: session, status } = useSession()

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>

            <div className="space-y-4">
                <div>
                    <p className="font-semibold">Status:</p>
                    <p>{status}</p>
                </div>

                {session ? (
                    <div>
                        <p className="font-semibold">Logged in as:</p>
                        <p>{JSON.stringify(session.user)}</p>
                    </div>
                ) : (
                    <p>Not logged in</p>
                )}
            </div>

            <UserInfo />
        </div>
    )
}
