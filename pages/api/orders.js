export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !databaseId) {
    return res.status(500).json({ error: 'Notion credentials not configured in environment variables' });
  }

  try {
    const today = new Date();
    const eightDaysOut = new Date();
    eightDaysOut.setDate(today.getDate() + 8);

    const todayStr = today.toISOString().split('T')[0];
    const eightDaysOutStr = eightDaysOut.toISOString().split('T')[0];

    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
  or: [
    {
      and: [
        { property: 'Status', status: { equals: 'Not started' } },
        { property: 'Due By', date: { on_or_after: todayStr } },
        { property: 'Due By', date: { on_or_before: eightDaysOutStr } },
      ],
    },
    {
      and: [
        { property: 'Status', status: { equals: 'Quoted' } },
        { property: 'Due By', date: { on_or_after: todayStr } },
        { property: 'Due By', date: { on_or_before: eightDaysOutStr } },
      ],
    },
    {
      and: [
        { property: 'Status', status: { equals: 'In progress' } },
        { property: 'Due By', date: { on_or_after: todayStr } },
        { property: 'Due By', date: { on_or_before: eightDaysOutStr } },
      ],
    },
    {
      and: [
        { property: 'Status', status: { equals: 'Not started' } },
        { property: 'Due By', date: { before: todayStr } },
      ],
    },
    {
      and: [
        { property: 'Status', status: { equals: 'Quoted' } },
        { property: 'Due By', date: { before: todayStr } },
      ],
    },
    {
      and: [
        { property: 'Status', status: { equals: 'In progress' } },
        { property: 'Due By', date: { before: todayStr } },
      ],
    },
  ],
},
        sorts: [
          {
            property: 'Due By',
            direction: 'ascending',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch from Notion', details: errorData });
    }

    const data = await response.json();

    const orders = data.results.map(page => {
      const props = page.properties;

      // Qty is a rich_text field
      const quantity = props['Quantity']?.rich_text?.[0]?.plain_text || '';

      // Bin is a multi_select field - return array of names
      const bin = props['Bin']?.multi_select?.map(b => b.name) || [];

      // Employee is multi_select - return array of names
      const employees = props['Employee']?.multi_select?.map(e => e.name) || [];

      // Embellishment is multi_select
      const embellishment = props['Embellishment']?.multi_select?.map(e => e.name).join(', ') || '';

      return {
        id: page.id,
        client: props['Client']?.title?.[0]?.plain_text || 'Unknown',
        dueDate: props['Due By']?.date?.start || '',
        status: props['Status']?.status?.name || props['Status']?.select?.name || 'Not started',
        embellishment,
        employees,
        quantity,
        time: props['Time']?.rich_text?.[0]?.plain_text || '',
        bin,
      };
    });

    res.setHeader('Cache-Control', 's-maxage=25, stale-while-revalidate');
    return res.status(200).json({ orders });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
