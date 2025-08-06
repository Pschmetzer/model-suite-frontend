import React from "react";
import { Plus } from "lucide-react";
import Button from "./Button";

const Header = React.memo(({ onClick }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold">Billing</h1>
    <Button onClick={onClick}>
      <Plus className="mr-2" /> Create Invoice
    </Button>
  </div>
));

export default Header;
