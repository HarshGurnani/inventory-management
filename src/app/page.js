"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { firestore } from "/Users/harshgurnani/Documents/Projects/inventory-management/src/firebase.js";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  List,
  ListItem,
  Modal,
  Stack,
} from "@mui/material";
import { Delete, Add, Edit, LocalDining } from "@mui/icons-material";
import { Unstable_NumberInput as NumberInput } from "@mui/base/Unstable_NumberInput";
import OpenAI from "openai";
import ReactMarkdown from "react-markdown";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  dangerouslyAllowBrowser: true,
});

const container_style = {
  bgcolor: "white",
};

const modal_style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "white",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const recipe_style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 1200,
  bgcolor: "white",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [inputAmount, setInputAmount] = useState(1);
  const [recipe, setRecipe] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "inventory"));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const addItem = async (item, amount) => {
    item = item.toLowerCase();
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + amount });
    } else {
      await setDoc(docRef, { quantity: amount });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const deleteItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await deleteDoc(docRef);
    }
    await updateInventory();
  };

  const handleGenerateRecipe = async () => {
    const itemsList = inventory
      .map((item) => `${item.name} (${item.quantity})`)
      .join(", ");
    const prompt = `I have the following items in my pantry [${itemsList}]. Give me a recipe I can make with these - list out the ingredients/quantities, and then the instructions. You do not have to use all the items.`;

    try {
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: prompt }],
        model: "gpt-4o-mini",
      });
      setRecipe(String(completion.choices[0].message.content));
    } catch (error) {
      console.error("Error generating recipe:", error);
    }
  };

  const handleAddOpen = () => setAddOpen(true);
  const handleAddClose = () => setAddOpen(false);

  const handleRecipeOpen = () => {
    handleGenerateRecipe();
    setRecipeOpen(true);
  };
  const handleRecipeClose = () => {
    setRecipe("");
    setRecipeOpen(false);
  };

  return (
    <Container maxWidth="sm" sx={container_style}>
      <Modal open={addOpen} onClose={handleAddClose}>
        <Box sx={modal_style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={"row"} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(Number(e.target.value))}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addItem(inputValue, inputAmount);
                setInputValue("");
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      <Modal open={recipeOpen} onClose={handleRecipeClose}>
        <Box sx={recipe_style}>
          <Stack width="100%" direction={"row"} spacing={2}>
            <Typography variant="body1">
              <ReactMarkdown>{recipe}</ReactMarkdown>
            </Typography>
          </Stack>
        </Box>
      </Modal>
      <Box my={4} textAlign="center">
        <Typography variant="h2" component="h2" gutterBottom>
          Pantry Management
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item Name</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.map(({ name, quantity }) => (
              <TableRow key={name}>
                <TableCell>
                  <Typography>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography>{quantity}</Typography>
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => addItem(name, 1)}>
                    <Add />
                  </IconButton>
                  <IconButton color="primary" onClick={() => removeItem(name)}>
                    <span style={{ fontSize: "1.5rem" }}>-</span>
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => deleteItem(name)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" mt={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddOpen}
          startIcon={<Add />}
          sx={{ ml: 2 }}
        >
          Add New Item
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRecipeOpen}
          startIcon={<LocalDining />}
          sx={{ ml: 2 }}
        >
          Generate Recipe
        </Button>
      </Box>
    </Container>
  );
}
