import { useState, useEffect, useCallback } from "react";
import { getLiveFeed } from "@/lib/api";
import { MOCK_FEED } from "@/lib/mocks";

export interface FeedItem {
    id: string;
    flight: string;
    route: string;
    status: string;
    timestamp: string;
    type: "delay" | "cleared" | "board";
}

export function useLiveFeed(airportCode: string | null) {
    const filterMock = (code: string | null): FeedItem[] => {
        if (!code) return MOCK_FEED as FeedItem[];
        return MOCK_FEED.filter((f: any) => f.route.includes(code)) as FeedItem[];
    };

    const [feed, setFeed] = useState<FeedItem[]>(filterMock(airportCode));
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchFeed = useCallback(async () => {
        if (!airportCode) return;
        try {
            const data: FeedItem[] = await getLiveFeed();
            if (data && data.length > 0) {
                const filtered = data.filter(f => f.route.includes(airportCode));
                setFeed(filtered);
                setIsLive(true);
            } else {
                setFeed(filterMock(airportCode));
                setIsLive(false);
            }
        } catch {
            setFeed(filterMock(airportCode));
            setIsLive(false);
        } finally {
            setLoading(false);
        }
    }, [airportCode]);

    useEffect(() => {
        setFeed(filterMock(airportCode));
        setIsLive(false);
        fetchFeed();
        
        const interval = setInterval(fetchFeed, 30_000);
        return () => clearInterval(interval);
    }, [fetchFeed, airportCode]);

    return { feed, isLive, loading, refetch: fetchFeed };
}
