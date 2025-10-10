import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { Skeleton } from 'primereact/skeleton';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

export default function ArtworkDataTable() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(12);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [rowsToSelect, setRowsToSelect] = useState<number | null>(null);
  const selectionMap = useRef<Map<number, Artwork>>(new Map());
  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    fetchArtworks(1, rows);
  }, []);

  const fetchArtworks = async (page: number, pageSize: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${pageSize}`
      );
      const data: ApiResponse = await response.json();
      
      const formattedData: Artwork[] = data.data.map((item: any) => ({
        id: item.id,
        title: item.title || 'N/A',
        place_of_origin: item.place_of_origin || 'N/A',
        artist_display: item.artist_display || 'N/A',
        inscriptions: item.inscriptions || 'N/A',
        date_start: item.date_start || 0,
        date_end: item.date_end || 0,
      }));

      setArtworks(formattedData);
      setTotalRecords(data.pagination.total);
      
      const currentPageSelected = formattedData.filter(artwork => 
        selectionMap.current.has(artwork.id)
      );
      setSelectedArtworks(currentPageSelected);
      
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    const newPage = Math.floor(event.first / event.rows) + 1;
    setFirst(event.first);
    setRows(event.rows);
    fetchArtworks(newPage, event.rows);
  };

  const onSelectionChange = (e: any) => {
    const newSelection = e.value;
    
    artworks.forEach(artwork => {
      selectionMap.current.delete(artwork.id);
    });
    
    newSelection.forEach((artwork: Artwork) => {
      selectionMap.current.set(artwork.id, artwork);
    });
    
    setSelectedArtworks(newSelection);
  };

  const handleSelectRows = async () => {
    if (rowsToSelect === null || rowsToSelect <= 0) return;
    
    setLoading(true);
    let remainingToSelect = rowsToSelect;
    const currentPage = Math.floor(first / rows) + 1;
    let page = currentPage;
    
    selectionMap.current.clear();
    
    while (remainingToSelect > 0) {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`
      );
      const data: ApiResponse = await response.json();
      
      const pageData: Artwork[] = data.data.map((item: any) => ({
        id: item.id,
        title: item.title || 'N/A',
        place_of_origin: item.place_of_origin || 'N/A',
        artist_display: item.artist_display || 'N/A',
        inscriptions: item.inscriptions || 'N/A',
        date_start: item.date_start || 0,
        date_end: item.date_end || 0,
      }));
      
      const toSelectFromPage = Math.min(remainingToSelect, pageData.length);
      
      for (let i = 0; i < toSelectFromPage; i++) {
        selectionMap.current.set(pageData[i].id, pageData[i]);
      }
      
      remainingToSelect -= toSelectFromPage;
      page++;
      
      if (page > data.pagination.total_pages) break;
    }
    
    const currentPageSelected = artworks.filter(artwork => 
      selectionMap.current.has(artwork.id)
    );
    setSelectedArtworks(currentPageSelected);
    op.current?.hide();
    setRowsToSelect(null);
    setLoading(false);
  };


  const inscriptionsBodyTemplate = (rowData: Artwork) => {
    const inscription = rowData.inscriptions;
    if (!inscription || inscription === 'N/A' || inscription.length < 50) {
      return inscription;
    }
    const truncated = inscription.substring(0, 50) + '...';
    return (
      <>
        <Tooltip target={`.tooltip-id-${rowData.id}`} />
        <span className={`tooltip-id-${rowData.id}`} data-pr-tooltip={inscription}>
          {truncated}
        </span>
      </>
    );
  };

  const selectionColumnHeaderTemplate = (options: any) => {
      return (
          <div className="flex align-items-center gap-2">
              {options.headerCheckbox}
              <Button
                  // icon="pi pi-chevron-down"
                  className="pi pi-chevron-down"
                  onClick={(e) => op.current?.toggle(e)}
              />
          </div>
      );
  };

  if (loading && !artworks.length) {
      return (
          <div className="p-6">
              <Card>
                  <Skeleton width="30%" height="2rem" className="mb-4" />
                  <Skeleton height="500px" />
              </Card>
          </div>
      );
  }

  return (
    <>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="mx-auto">
          
          <OverlayPanel ref={op}>
            <div className="flex flex-column gap-3 p-3" style={{width: '250px'}}>
              <span className="font-bold">Select First 'N' Rows</span>
              <InputNumber
                value={rowsToSelect}
                onValueChange={(e) => setRowsToSelect(e.value)}
                placeholder="Enter number of rows"
                min={0}
              />
              <Button
                label="Submit"
                icon="pi pi-check"
                onClick={handleSelectRows}
                disabled={!rowsToSelect || rowsToSelect <= 0}
                className="p-button-outlined"
              />
            </div>
          </OverlayPanel>
          
          <Card>
            <DataTable
              value={artworks}
              selection={selectedArtworks}
              onSelectionChange={onSelectionChange}
              dataKey="id"
              paginator
              rows={rows}
              first={first}
              totalRecords={totalRecords}
              lazy
              onPage={onPageChange}
              loading={loading}
              rowsPerPageOptions={[12, 24, 36, 48]}
              showGridlines
              stripedRows
              emptyMessage="No artworks found."
              selectionMode="multiple"
              // header={tableHeader}
            >
              <Column
                selectionMode="multiple"
                header={selectionColumnHeaderTemplate}
                headerStyle={{ width: '6rem' }}
                frozen
              />
              <Column
                field="title"
                header="Title"
                style={{ minWidth: '250px' }}
                sortable
              />
              <Column
                field="artist_display"
                header="Artist"
                style={{ minWidth: '250px' }}
              />
              <Column
                field="place_of_origin"
                header="Origin"
                style={{ minWidth: '150px' }}
              />
              <Column
                field="inscriptions"
                header="Inscriptions"
                body={inscriptionsBodyTemplate}
                style={{ minWidth: '250px' }}
              />
              <Column
                field="date_start"
                header="Start Date"
                style={{ minWidth: '120px' }}
                sortable
              />
              <Column
                field="date_end"
                header="Date End"
                style={{ minWidth: '120px' }}
                sortable
              />
            </DataTable>
          </Card>
        </div>
      </div>
    </>
  );
}