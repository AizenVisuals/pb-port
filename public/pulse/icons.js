const paths={
 home:'M3 11 12 3l9 8M5 10v11h5v-6h4v6h5V10',
 team:'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21v-2a6 6 0 0 1 12 0v2M17 4a4 4 0 0 1 0 8m0 3a6 6 0 0 1 5 6',
 collection:'M4 3h6v8H4zm10 0h6v8h-6zM4 15h6v6H4zm10 0h6v6h-6z',
 gift:'M3 8h18v5H3zm2 5v8h14v-8M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z',
 coin:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM10 7h3a3 3 0 0 1 0 6h-3m0-6v10m0-4h3',
 bolt:'m13 2-9 12h7l-1 8 10-13h-7l1-7Z',
 search:'M20 20 15 15M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
 heart:'M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1C-1 10 6 16 12 21c6-5 13-11 8-16Z',
 info:'M12 11v6m0-10v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
 back:'m14 5-7 7 7 7',
 pause:'M8 4v16M16 4v16',
 shield:'M12 3 3 7v5c0 5 9 10 9 10s9-5 9-10V7l-9-4Z',
 dash:'m4 18 9-12m-7 0h7v7m-9 1H1m5 5H3m17-8h3m-5-5h3',
 close:'m5 5 14 14M19 5 5 19',
 check:'m4 12 5 5L20 6',
 star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z'
};
export function icon(name,extra=''){return `<svg ${extra} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.bolt}"/></svg>`;}
