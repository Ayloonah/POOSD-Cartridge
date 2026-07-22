import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback
} from 'react';

import DashboardLayout from '../components/DashboardLayout';
import CollectionGameCard from '../components/CollectionGameCard';
import AddGameModal from '../components/AddGameModal';
import GameDetailModal from '../components/GameDetailModal';
import EditGameModal from '../components/EditGameModal';
import Button from '../components/Button';

import { api } from '../api';
import { AuthContext } from '../context/AuthContext';


function normalizeEntry(rawEntry) {
  const populatedGame =
    rawEntry?.gameId &&
    typeof rawEntry.gameId === 'object'
      ? rawEntry.gameId
      : null;

  return {
    ...rawEntry,

    entryId:
      rawEntry?._id?.toString() ||
      rawEntry?.entryId?.toString(),

    gameId: populatedGame
      ? populatedGame._id?.toString()
      : rawEntry?.gameId?.toString(),

    rawgId:
      populatedGame?.rawgId ||
      rawEntry?.rawgId ||
      null,

    name:
      populatedGame?.name ||
      rawEntry?.name ||
      'Unknown Game',

    coverImage:
      populatedGame?.coverImage ||
      rawEntry?.coverImage ||
      null,

    genres:
      populatedGame?.genres ||
      rawEntry?.genres ||
      [],

    platforms:
      populatedGame?.platforms ||
      rawEntry?.platforms ||
      [],

    releaseDate:
      populatedGame?.releaseDate ||
      rawEntry?.releaseDate ||
      null,

    developers:
      populatedGame?.developers ||
      rawEntry?.developers ||
      [],

    listIds: Array.isArray(rawEntry?.listIds)
      ? rawEntry.listIds
      : []
  };
}

function getDeveloperNames(entry) {
  const developers = Array.isArray(entry?.developers)
    ? entry.developers
    : [];

  return developers
    .map((developer) => {
      if (typeof developer === 'string') {
        return developer;
      }

      return developer?.name || '';
    })
    .filter(Boolean);
}

function getGenreNames(entry) {
  const genres = Array.isArray(entry?.genres)
    ? entry.genres
    : [];

  return genres
    .map((genre) => {
      if (typeof genre === 'string') {
        return genre;
      }

      return genre?.name || '';
    })
    .filter(Boolean);
}

export default function CollectionPage() {
  const { token } = useContext(AuthContext);

  const currentToken =
    token || localStorage.getItem('token');

  // Collection data
  const [userCollection, setUserCollection] = useState([]);
  const [userLists, setUserLists] = useState([]);

  // Loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Search
  const [collectionSearch, setCollectionSearch] =
    useState('');

  // Filters
  const [filterLists, setFilterLists] = useState([]);
  const [playedFilter, setPlayedFilter] = useState('All');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [filterDevelopers, setFilterDevelopers] =
    useState([]);
  const [filterGenres, setFilterGenres] = useState([]);

  // Sorting
  const [collectionSortRule, setCollectionSortRule] =
    useState('date_desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const savedValue = localStorage.getItem(
      'cartridge_items_per_page'
    );

    if (savedValue === 'All') {
      return 'All';
    }

    const parsedValue = Number(savedValue);

    return parsedValue > 0 ? parsedValue : 10;
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] =
    useState(false);

  const [selectedEntry, setSelectedEntry] =
    useState(null);

  const [entryToEdit, setEntryToEdit] =
    useState(null);

  /*
   * Load collection and lists from the backend.
   */
  const fetchCollectionData = useCallback(async () => {
    if (!currentToken) {
      setError('You must be logged in to view your collection.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const [collectionResponse, listsResponse] =
        await Promise.all([
          api.get(
            '/user-game-entries/collection',
            currentToken
          ),
          api.get('/lists', currentToken)
        ]);

      if (!collectionResponse.ok) {
        const collectionError =
          await collectionResponse
            .json()
            .catch(() => ({}));

        throw new Error(
          collectionError.error ||
            collectionError.message ||
            'Failed to load collection.'
        );
      }

      if (!listsResponse.ok) {
        const listsError = await listsResponse
          .json()
          .catch(() => ({}));

        throw new Error(
          listsError.error ||
            listsError.message ||
            'Failed to load lists.'
        );
      }

      const collectionData =
        await collectionResponse.json();

      const listsData = await listsResponse.json();

      const entries = Array.isArray(collectionData)
        ? collectionData
        : Array.isArray(collectionData?.entries)
          ? collectionData.entries
          : [];

      const lists = Array.isArray(listsData)
        ? listsData
        : Array.isArray(listsData?.lists)
          ? listsData.lists
          : [];

      setUserCollection(entries.map(normalizeEntry));
      setUserLists(lists);
    } catch (fetchError) {
      console.error(
        'Collection page fetch error:',
        fetchError
      );

      setError(
        fetchError.message ||
          'Failed to load collection data.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentToken]);

  useEffect(() => {
    fetchCollectionData();
  }, [fetchCollectionData]);

  /*
   * Create filter options dynamically from the user's collection.
   */
  const dynamicDevelopers = useMemo(() => {
    const developers = userCollection.flatMap(
      getDeveloperNames
    );

    return [...new Set(developers)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [userCollection]);

  const dynamicGenres = useMemo(() => {
    const genres =
      userCollection.flatMap(getGenreNames);

    return [...new Set(genres)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [userCollection]);

  /*
   * Return normalized list IDs for an entry.
   */
  const getEntryListIds = (entry) => {
    if (!Array.isArray(entry?.listIds)) {
      return [];
    }

    return entry.listIds
      .map((listId) => {
        if (
          listId &&
          typeof listId === 'object'
        ) {
          return listId._id?.toString();
        }

        return listId?.toString();
      })
      .filter(Boolean);
  };

  /*
   * Convert an entry's list IDs into names for CollectionGameCard.
   */
  const getListNames = (entry) => {
    const entryListIds = getEntryListIds(entry);

    return userLists
      .filter((list) =>
        entryListIds.includes(list._id?.toString())
      )
      .map((list) => list.name);
  };

  const toggleCheckboxFilter = (
    item,
    currentState,
    setter
  ) => {
    setter(
      currentState.includes(item)
        ? currentState.filter(
            (currentItem) => currentItem !== item
          )
        : [...currentState, item]
    );

    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setCollectionSearch('');
    setFilterLists([]);
    setPlayedFilter('All');
    setYearMin('');
    setYearMax('');
    setFilterDevelopers([]);
    setFilterGenres([]);
    setCollectionSortRule('date_desc');
    setCurrentPage(1);
  };

  /*
   * Search, filter, and sort the collection.
   */
  const processedCollection = useMemo(() => {
    const normalizedSearch =
      collectionSearch.trim().toLowerCase();

    return [...userCollection]
      .filter((entry) => {
        if (!normalizedSearch) {
          return true;
        }

        const name =
          entry.name?.toLowerCase() || '';

        const developers = getDeveloperNames(entry)
          .join(' ')
          .toLowerCase();

        const genres = getGenreNames(entry)
          .join(' ')
          .toLowerCase();

        const platform =
          entry.platformPlayed?.toLowerCase() || '';

        const review =
          entry.review?.toLowerCase() || '';

        return (
          name.includes(normalizedSearch) ||
          developers.includes(normalizedSearch) ||
          genres.includes(normalizedSearch) ||
          platform.includes(normalizedSearch) ||
          review.includes(normalizedSearch)
        );
      })

      // List filter
      .filter((entry) => {
        if (filterLists.length === 0) {
          return true;
        }

        const entryListIds =
          getEntryListIds(entry);

        return entryListIds.some((listId) =>
          filterLists.includes(listId)
        );
      })

      // Played status filter
      .filter((entry) => {
        if (playedFilter === 'All') {
          return true;
        }

        if (playedFilter === 'Played') {
          return entry.played === true;
        }

        return entry.played !== true;
      })

      // Release year filter
      .filter((entry) => {
        if (!yearMin && !yearMax) {
          return true;
        }

        if (!entry.releaseDate) {
          return false;
        }

        const releaseYear = new Date(
          entry.releaseDate
        ).getFullYear();

        if (Number.isNaN(releaseYear)) {
          return false;
        }

        const meetsMinimum =
          !yearMin ||
          releaseYear >= Number(yearMin);

        const meetsMaximum =
          !yearMax ||
          releaseYear <= Number(yearMax);

        return meetsMinimum && meetsMaximum;
      })

      // Developer filter
      .filter((entry) => {
        if (filterDevelopers.length === 0) {
          return true;
        }

        const entryDevelopers =
          getDeveloperNames(entry);

        return entryDevelopers.some((developer) =>
          filterDevelopers.includes(developer)
        );
      })

      // Genre filter
      .filter((entry) => {
        if (filterGenres.length === 0) {
          return true;
        }

        const entryGenres =
          getGenreNames(entry);

        return entryGenres.some((genre) =>
          filterGenres.includes(genre)
        );
      })

      // Sorting
      .sort((entryA, entryB) => {
        const titleA = entryA.name || '';
        const titleB = entryB.name || '';

        const developerA =
          getDeveloperNames(entryA)[0] || '';

        const developerB =
          getDeveloperNames(entryB)[0] || '';

        const ratingA =
          Number(entryA.rating) || 0;

        const ratingB =
          Number(entryB.rating) || 0;

        const dateA = new Date(
          entryA.createdAt ||
            entryA.dateAdded ||
            0
        ).getTime();

        const dateB = new Date(
          entryB.createdAt ||
            entryB.dateAdded ||
            0
        ).getTime();

        switch (collectionSortRule) {
          case 'date_asc':
            return dateA - dateB;

          case 'title_asc':
            return titleA.localeCompare(titleB);

          case 'title_desc':
            return titleB.localeCompare(titleA);

          case 'dev_asc':
            return developerA.localeCompare(
              developerB
            );

          case 'dev_desc':
            return developerB.localeCompare(
              developerA
            );

          case 'rate_desc':
            return ratingB - ratingA;

          case 'rate_asc':
            return ratingA - ratingB;

          case 'date_desc':
          default:
            return dateB - dateA;
        }
      });
  }, [
    userCollection,
    collectionSearch,
    filterLists,
    playedFilter,
    yearMin,
    yearMax,
    filterDevelopers,
    filterGenres,
    collectionSortRule
  ]);

  const effectiveItemsPerPage =
    itemsPerPage === 'All'
      ? Math.max(processedCollection.length, 1)
      : itemsPerPage;

  const totalPages = Math.max(
    1,
    Math.ceil(
      processedCollection.length /
        effectiveItemsPerPage
    )
  );

  const paginatedCollection = useMemo(() => {
    if (itemsPerPage === 'All') {
      return processedCollection;
    }

    const startingIndex =
      (currentPage - 1) * itemsPerPage;

    return processedCollection.slice(
      startingIndex,
      startingIndex + itemsPerPage
    );
  }, [
    processedCollection,
    currentPage,
    itemsPerPage
  ]);

  /*
   * Prevent the page number from remaining too high
   * after filters reduce the number of results.
   */
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleItemsPerPageChange = (value) => {
    const newValue =
      value === 'All' ? 'All' : Number(value);

    setItemsPerPage(newValue);

    localStorage.setItem(
      'cartridge_items_per_page',
      String(newValue)
    );

    setCurrentPage(1);
  };

  /*
   * Called after AddGameModal successfully saves a game.
   *
   * This closes the add flow, clears the search,
   * returns to page 1, and reloads the collection.
   */
  const handleGameAdded = async () => {
    setIsAddModalOpen(false);
    setCollectionSearch('');
    setCurrentPage(1);

    await fetchCollectionData();
  };

  /*
   * Handles the duplicate-entry action from AddGameModal.
   */
  const handleOpenDuplicateEntry = (
    duplicateEntryId
  ) => {
    const normalizedDuplicateId =
      duplicateEntryId?.toString();

    const existingEntry = userCollection.find(
      (entry) =>
        entry.entryId?.toString() ===
          normalizedDuplicateId ||
        entry._id?.toString() ===
          normalizedDuplicateId
    );

    setIsAddModalOpen(false);

    setEntryToEdit(
      existingEntry || {
        _id: normalizedDuplicateId,
        entryId: normalizedDuplicateId
      }
    );
  };

  const currentYear = new Date().getFullYear();

  const yearOptions = Array.from(
    {
      length: currentYear - 1970 + 1
    },
    (_, index) => currentYear - index
  );

  const hasActiveFilters =
    collectionSearch.trim() !== '' ||
    filterLists.length > 0 ||
    playedFilter !== 'All' ||
    yearMin !== '' ||
    yearMax !== '' ||
    filterDevelopers.length > 0 ||
    filterGenres.length > 0 ||
    collectionSortRule !== 'date_desc';

  return (
    <DashboardLayout
      showSearch
      searchValue={collectionSearch}
      searchPlaceholder="Search your collection..."
      onSearchChange={(value) => {
        setCollectionSearch(value);
        setCurrentPage(1);
      }}
    >
      {/* Add Game Modal */}
      <AddGameModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveSuccess={handleGameAdded}
        onOpenEditModal={handleOpenDuplicateEntry}
      />

      {/* View Game Details Modal */}
      <GameDetailModal
        isOpen={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
        userLists={userLists}
        onEdit={(entry) => {
          setSelectedEntry(null);
          setEntryToEdit(entry);
        }}
      />

      {/* Edit Game Modal */}
      <EditGameModal
        isOpen={entryToEdit !== null}
        onClose={() => setEntryToEdit(null)}
        entry={entryToEdit}
        userLists={userLists}
        onSaveSuccess={async () => {
          setEntryToEdit(null);
          await fetchCollectionData();
        }}
      />

      {/* Page heading */}
      <section
        style={{
          marginBottom: '28px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <h1
              className="font-vt323"
              style={{
                margin: 0,
                color: '#143910',
                fontSize: '42px',
                letterSpacing: '1px',
                lineHeight: 1
              }}
            >
              My Collection
            </h1>

            <p
              style={{
                margin: '8px 0 0 0',
                color: '#6B7280',
                fontSize: '14px'
              }}
            >
              Showing {processedCollection.length}{' '}
              {processedCollection.length === 1
                ? 'title'
                : 'titles'}
              {userCollection.length !==
                processedCollection.length &&
                ` out of ${userCollection.length}`}
              .
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '10px 20px',
              fontSize: '14px'
            }}
          >
            + Add Game
          </Button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '24px',
            padding: '14px 16px',
            borderRadius: '8px',
            border: '1px solid #FCA5A5',
            backgroundColor: '#FEF2F2',
            color: '#B91C1C',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(220px, 260px) minmax(0, 1fr)',
          gap: '32px',
          alignItems: 'start'
        }}
      >
        {/* Filter sidebar */}
        <aside
          style={{
            paddingRight: '24px',
            borderRight: '2px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <h2
              className="font-vt323"
              style={{
                margin: 0,
                color: '#143910',
                fontSize: '28px',
                letterSpacing: '1px'
              }}
            >
              Filters
            </h2>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  padding: 0,
                  background: 'none',
                  color: '#143910',
                  fontSize: '12px',
                  fontWeight: '700',
                  textDecoration: 'underline'
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sort */}
          <div>
            <label
              htmlFor="collection-sort"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#143910',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              Sort By
            </label>

            <select
              id="collection-sort"
              value={collectionSortRule}
              onChange={(event) => {
                setCollectionSortRule(
                  event.target.value
                );
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 10px',
                borderRadius: '6px',
                border: '2px solid #143910',
                backgroundColor: '#FFFFFF',
                color: '#143910',
                fontFamily: 'Inter',
                fontSize: '13px',
                fontWeight: '600',
                outline: 'none'
              }}
            >
              <option value="date_desc">
                Date Added: Newest
              </option>

              <option value="date_asc">
                Date Added: Oldest
              </option>

              <option value="title_asc">
                Title: A–Z
              </option>

              <option value="title_desc">
                Title: Z–A
              </option>

              <option value="dev_asc">
                Developer: A–Z
              </option>

              <option value="dev_desc">
                Developer: Z–A
              </option>

              <option value="rate_desc">
                Rating: Highest
              </option>

              <option value="rate_asc">
                Rating: Lowest
              </option>
            </select>
          </div>

          {/* List filter */}
          <div>
            <h3
              style={{
                margin: '0 0 8px 0',
                color: '#143910',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              Belongs to List
            </h3>

            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF'
              }}
            >
              {userLists.length > 0 ? (
                userLists.map((list) => {
                  const listId =
                    list._id?.toString();

                  return (
                    <label
                      key={listId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '7px',
                        color: '#374151',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filterLists.includes(
                          listId
                        )}
                        onChange={() =>
                          toggleCheckboxFilter(
                            listId,
                            filterLists,
                            setFilterLists
                          )
                        }
                        style={{
                          width: '15px',
                          height: '15px'
                        }}
                      />

                      {list.name}
                    </label>
                  );
                })
              ) : (
                <span
                  style={{
                    color: '#9CA3AF',
                    fontSize: '12px'
                  }}
                >
                  No lists created yet.
                </span>
              )}
            </div>
          </div>

          {/* Gameplay status */}
          <div>
            <label
              htmlFor="played-filter"
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#143910',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              Gameplay Status
            </label>

            <select
              id="played-filter"
              value={playedFilter}
              onChange={(event) => {
                setPlayedFilter(event.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 10px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                fontFamily: 'Inter',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="All">
                All Games
              </option>

              <option value="Played">
                Played
              </option>

              <option value="Unplayed">
                Not Yet Played
              </option>
            </select>
          </div>

          {/* Release year */}
          <div>
            <h3
              style={{
                margin: '0 0 8px 0',
                color: '#143910',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              Release Year
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <select
                aria-label="Minimum release year"
                value={yearMin}
                onChange={(event) => {
                  setYearMin(event.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  minWidth: 0,
                  padding: '8px 6px',
                  borderRadius: '5px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'Inter',
                  fontSize: '12px'
                }}
              >
                <option value="">Any</option>

                {[...yearOptions]
                  .reverse()
                  .map((year) => (
                    <option
                      key={year}
                      value={year}
                      disabled={
                        yearMax &&
                        year > Number(yearMax)
                      }
                    >
                      {year}
                    </option>
                  ))}
              </select>

              <span
                style={{
                  color: '#6B7280',
                  fontSize: '12px'
                }}
              >
                to
              </span>

              <select
                aria-label="Maximum release year"
                value={yearMax}
                onChange={(event) => {
                  setYearMax(event.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  minWidth: 0,
                  padding: '8px 6px',
                  borderRadius: '5px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'Inter',
                  fontSize: '12px'
                }}
              >
                <option value="">Any</option>

                {yearOptions.map((year) => (
                  <option
                    key={year}
                    value={year}
                    disabled={
                      yearMin &&
                      year < Number(yearMin)
                    }
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Developer filter */}
          <div>
            <h3
              style={{
                margin: '0 0 8px 0',
                color: '#143910',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              Developer
            </h3>

            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF'
              }}
            >
              {dynamicDevelopers.length > 0 ? (
                dynamicDevelopers.map(
                  (developer) => (
                    <label
                      key={developer}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '7px',
                        color: '#374151',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filterDevelopers.includes(
                          developer
                        )}
                        onChange={() =>
                          toggleCheckboxFilter(
                            developer,
                            filterDevelopers,
                            setFilterDevelopers
                          )
                        }
                        style={{
                          width: '15px',
                          height: '15px'
                        }}
                      />

                      {developer}
                    </label>
                  )
                )
              ) : (
                <span
                  style={{
                    color: '#9CA3AF',
                    fontSize: '12px'
                  }}
                >
                  No developers available.
                </span>
              )}
            </div>
          </div>

          {/* Genre filter */}
          <div>
            <h3
              style={{
                margin: '0 0 8px 0',
                color: '#143910',
                fontSize: '14px',
                fontWeight: '700'
              }}
            >
              Genre
            </h3>

            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF'
              }}
            >
              {dynamicGenres.length > 0 ? (
                dynamicGenres.map((genre) => (
                  <label
                    key={genre}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '7px',
                      color: '#374151',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filterGenres.includes(
                        genre
                      )}
                      onChange={() =>
                        toggleCheckboxFilter(
                          genre,
                          filterGenres,
                          setFilterGenres
                        )
                      }
                      style={{
                        width: '15px',
                        height: '15px'
                      }}
                    />

                    {genre}
                  </label>
                ))
              ) : (
                <span
                  style={{
                    color: '#9CA3AF',
                    fontSize: '12px'
                  }}
                >
                  No genres available.
                </span>
              )}
            </div>
          </div>
        </aside>

        {/* Collection content */}
        <section
          style={{
            minWidth: 0
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: '70px 20px',
                textAlign: 'center',
                color: '#143910',
                fontSize: '15px',
                fontWeight: '700'
              }}
            >
              Loading your collection...
            </div>
          ) : userCollection.length === 0 ? (
            <div
              style={{
                padding: '70px 24px',
                textAlign: 'center',
                border: '2px dashed #98B910',
                borderRadius: '16px',
                backgroundColor: '#F9FAFB'
              }}
            >
              <div
                style={{
                  marginBottom: '14px',
                  fontSize: '48px'
                }}
              >
                🕹️
              </div>

              <h2
                className="font-vt323"
                style={{
                  margin: '0 0 10px 0',
                  color: '#143910',
                  fontSize: '30px'
                }}
              >
                Your Collection is Empty
              </h2>

              <p
                style={{
                  maxWidth: '440px',
                  margin: '0 auto 22px auto',
                  color: '#6B7280',
                  fontSize: '14px',
                  lineHeight: 1.5
                }}
              >
                Add your first game to begin tracking
                what you have played, your hours,
                ratings, reviews, and lists.
              </p>

              <Button
                variant="primary"
                onClick={() =>
                  setIsAddModalOpen(true)
                }
              >
                + Add Your First Game
              </Button>
            </div>
          ) : processedCollection.length === 0 ? (
            <div
              style={{
                padding: '70px 24px',
                textAlign: 'center',
                border: '2px dashed #D1D5DB',
                borderRadius: '16px',
                backgroundColor: '#F9FAFB'
              }}
            >
              <div
                style={{
                  marginBottom: '14px',
                  fontSize: '42px'
                }}
              >
                🔍
              </div>

              <h2
                className="font-vt323"
                style={{
                  margin: '0 0 10px 0',
                  color: '#143910',
                  fontSize: '30px'
                }}
              >
                No Matching Games
              </h2>

              <p
                style={{
                  margin: '0 0 20px 0',
                  color: '#6B7280',
                  fontSize: '14px'
                }}
              >
                Try changing your search or clearing
                some filters.
              </p>

              <Button
                variant="tertiary"
                onClick={clearAllFilters}
                style={{
                  border: '1px solid #98B910',
                  color: '#143910'
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '24px'
              }}
            >
              {paginatedCollection.map((entry) => (
                <CollectionGameCard
                  key={entry.entryId || entry._id}
                  entry={entry}
                  listNames={getListNames(entry)}
                  onClick={() =>
                    setSelectedEntry(entry)
                  }
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading &&
            processedCollection.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: '2px solid #F3F4F6'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <label
                    htmlFor="items-per-page"
                    style={{
                      color: '#6B7280',
                      fontSize: '13px'
                    }}
                  >
                    Show:
                  </label>

                  <select
                    id="items-per-page"
                    value={itemsPerPage}
                    onChange={(event) =>
                      handleItemsPerPageChange(
                        event.target.value
                      )
                    }
                    style={{
                      padding: '7px 8px',
                      borderRadius: '5px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      fontFamily: 'Inter',
                      fontSize: '13px'
                    }}
                  >
                    <option value={10}>
                      10 per page
                    </option>

                    <option value={20}>
                      20 per page
                    </option>

                    <option value={50}>
                      50 per page
                    </option>

                    <option value="All">
                      All games
                    </option>
                  </select>
                </div>

                {itemsPerPage !== 'All' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px'
                    }}
                  >
                    <Button
                      variant="primary"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(1, page - 1)
                        )
                      }
                      style={{
                        padding: '8px 14px'
                      }}
                    >
                      Previous
                    </Button>

                    <span
                      style={{
                        color: '#374151',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      Page {currentPage} of{' '}
                      {totalPages}
                    </span>

                    <Button
                      variant="primary"
                      disabled={
                        currentPage === totalPages
                      }
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                        )
                      }
                      style={{
                        padding: '8px 14px'
                      }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
        </section>
      </div>
    </DashboardLayout>
  );
}