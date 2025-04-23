import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ users: [], groups: [] });
  const [loading, setLoading] = useState(false);

  const doSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:4000/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setResults(res.data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={4} pb={10}>
      {/* Search bar */}
      <TextField
        fullWidth
        placeholder="Search users or groups…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && doSearch()}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Chip
                icon={<SearchIcon />}
                label="Go"
                onClick={doSearch}
                size="small"
              />
            </InputAdornment>
          ),
        }}
      />

      {/* Results */}
      <Box mt={4}>
        {/* Users section */}
        <Typography variant="h6">Users</Typography>
        <Grid container spacing={2} mt={1}>
          {results.users.map((u) => (
            <Grid item xs={12} md={6} key={u.user_id}>
              <Card variant="outlined">
                <CardContent sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    src={
                      u.profile_picture
                        ? `data:image/jpeg;base64,${u.profile_picture}`
                        : undefined
                    }
                    sx={{ width: 56, height: 56, mr: 2 }}
                  />
                  <Box flex={1}>
                    <Typography fontWeight="bold">{u.username}</Typography>
                    <Typography noWrap>
                      {u.biography || "No bio provided."}
                    </Typography>
                    <Typography variant="caption">
                      {u.follower_count} followers •{" "}
                      {u.following_count} following •{" "}
                      {u.privacy_setting === "private" && "🔒 private"}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Groups section */}
        <Box mt={4}>
          <Typography variant="h6">Groups</Typography>
          <Grid container spacing={2} mt={1}>
            {results.groups.map((g) => (
              <Grid item xs={12} md={6} key={g.group_id}>
              <Card onClick={() => nav(`/groups/${g.group_id}`)} variant="outlined">
                  <CardContent>
                    <Typography fontWeight="bold">{g.group_name}</Typography>
                    <Typography noWrap>
                      {g.description || "No description."}
                    </Typography>
                    <Typography variant="caption">
                      {g.member_count} members •{" "}
                      {g.privacy_setting === "private" && "🔒 private"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}
