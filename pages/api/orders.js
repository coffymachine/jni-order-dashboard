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
          and: [
            {
              or: [
                { property: 'Status', status: { equals: 'Not started' } },
                { property: 'Status', status: { equals: 'Quoted' } },
                { property: 'Status', status: { equals: 'In progress' } },
              ],
            },
            {
              property: 'Due By',
              date: { on_or_after: todayStr },
            },
            {
              property: 'Due By',
              date: { on_or_before: eightDaysOutStr },
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
      let employee = '';
      const empProp = page.properties['Employee'];
      if (empProp?.multi_select) {
        employee = empProp.multi_select.map(e => e.name).join(', ');
      } else if (empProp?.rich_text) {
        employee = empProp.rich_text[0]?.plain_text || '';
      }

      let embellishment = '';
      const embProp = page.properties['Embellishment'];
      if (embProp?.multi_select) {
        embellishment = embProp.multi_select.map(e => e.name).join(', ');
      } else if (embProp?.select) {
        embellishment = embProp.select?.name || '';
      }

      let bin = '';
      const binProp = page.properties['Bin'];
      if (binProp?.select) {
        bin = binProp.select?.name || '';
      } else if (binProp?.rich_text) {
        bin = binProp.rich_text[0]?.plain_text || '';
      }

      return {
        id: page.id,
        client: page.properties['Client']?.title?.[0]?.plain_text || 'Unknown',
        dueDate: page.properties['Due By']?.date?.start || '',
        status: page.properties['Status']?.status?.name || page.properties['Status']?.select?.name || 'Not started',
        embellishment,
        employee,
        quantity: page.properties['Quantity']?.number || 0,
        time: page.properties['Time']?.rich_text?.[0]?.plain_text || '',
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
