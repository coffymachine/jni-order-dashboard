export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !databaseId) {
    return res.status(500).json({ error: 'Notion credentials not configured in environment variables' });
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          property: 'Status',
          status: {
            does_not_equal: 'Complete',
          },
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
      // Handle Employee - could be multi_select or rich_text
      let employee = '';
      const empProp = page.properties['Employee'];
      if (empProp?.multi_select) {
        employee = empProp.multi_select.map(e => e.name).join(', ');
      } else if (empProp?.rich_text) {
        employee = empProp.rich_text[0]?.plain_text || '';
      }

      // Handle Embellishment - could be multi_select or select
      let embellishment = '';
      const embProp = page.properties['Embellishment'];
      if (embProp?.multi_select) {
        embellishment = embProp.multi_select.map(e => e.name).join(', ');
      } else if (embProp?.select) {
        embellishment = embProp.select?.name || '';
      }

      // Handle Bin - could be select or rich_text
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
        status: page.properties['Status']?.status?.name || page.properties['Status']?.select?.name || 'Not Started',
        embellishment,
        employee,
        quantity: page.properties['Quantity']?.number || 0,
        time: page.properties['Time']?.rich_text?.[0]?.plain_text || '',
        bin,
      };
    });

    // Cache for 25 seconds (slightly less than the 30s frontend refresh)
    res.setHeader('Cache-Control', 's-maxage=25, stale-while-revalidate');
    return res.status(200).json({ orders });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
