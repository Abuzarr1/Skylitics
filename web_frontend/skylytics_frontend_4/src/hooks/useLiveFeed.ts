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
    airport?: string;
}

export function useLiveFeed(airportCode: string | null) {
    const filterMock = (code: string | null): FeedItem[] => {
        if (!code) return MOCK_FEED as FeedItem[];
        return MOCK_FEED.filter((f: any) => f.airport === code) as FeedItem[];
    };

    const [feed, setFeed] = useState<FeedItem[]>(filterMock(airportCode));
    const [dataSource, setDataSource] = useState<"LIVE" | "DEMO">("DEMO");
    const [loading, setLoading] = useState(true);

    const fetchFeed = useCallback(async () => {
        if (!airportCode) return;
        try {
            const data: FeedItem[] = await getLiveFeed();
            if (data && data.length > 0) {
                const filtered = data.filter(f => f.route.includes(airportCode) || f.airport === airportCode);
                if (filtered.length > 0) {
                    setFeed(filtered);
                    setDataSource("LIVE");
                    return;
                }
            }
        } catch (err) {
            // Silently fail to Demo
        }
        
        setFeed(filterMock(airportCode));
        setDataSource("DEMO");
    }, [airportCode]);

    useEffect(() => {
        setFeed(filterMock(airportCode));
        setDataSource("DEMO");
        fetchFeed();
        
        const interval = setInterval(fetchFeed, 30_000);
        return () => clearInterval(interval);
    }, [fetchFeed, airportCode]);

    return { feed, dataSource, isLive: dataSource === "LIVE", loading, refetch: fetchFeed };
}
