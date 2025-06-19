"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Wallet, 
  Send, 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  ArrowUpDown,
  TrendingUp
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

// Types
interface WalletState {
  isConnected: boolean;
  address: string;
  balance: string;
  wethBalance: string;
  chainId: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  gasUsed?: string;
  transactionType: 'SEND' | 'RECEIVE' | 'SWAP';
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  toAmount?: string;
}

// Constants - UPDATED với contracts chính thức
const SEPOLIA_CHAIN_ID = 11155111;

// OPTION 1: WETH9 (Uniswap Official) - KHUYÊN DÙNG
const WETH_ADDRESS = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'; // WETH9 - Uniswap official

// OPTION 2: WETH (Aave) - Alternative nếu option 1 không hoạt động  
// const WETH_ADDRESS = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9'; // WETH - Aave version

const WETH_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 wad) external", 
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 value) external returns (bool)",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function name() external view returns (string)",
  "function totalSupply() external view returns (uint256)"
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function TradingPage() {
  // 1. Context hooks first
  const { user, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // 2. All useState hooks
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: '',
    balance: '0',
    wethBalance: '0',
    chainId: 0
  });
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState<'ETH_TO_WETH' | 'WETH_TO_ETH'>('ETH_TO_WETH');
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'send' | 'swap' | 'receive' | 'history'>('send');

  // 3. All useEffect hooks
  // Auth check effect
  useEffect(() => {
    if (!user) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng tính năng giao dịch",
        variant: "destructive",
        duration: 5000
      });
      router.push("/User/Login");
    }
  }, [user, router, toast]);

  // Load wallet state effect
  useEffect(() => {
    const savedWalletState = localStorage.getItem('walletState');
    if (savedWalletState) {
      try {
        const parsedState = JSON.parse(savedWalletState);
        if (parsedState.isConnected && parsedState.address) {
          checkWalletConnection(parsedState.address);
        }
      } catch (error) {
        console.error('Error parsing saved wallet state:', error);
        localStorage.removeItem('walletState');
      }
    }
  }, []);

  // Save wallet state effect
  useEffect(() => {
    if (walletState.isConnected) {
      localStorage.setItem('walletState', JSON.stringify(walletState));
    } else {
      localStorage.removeItem('walletState');
    }
  }, [walletState]);

  // MetaMask event listeners effect
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== walletState.address) {
          connectWallet();
        }
      };

      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        if (newChainId !== SEPOLIA_CHAIN_ID && walletState.isConnected) {
          switchToSepolia();
        }
      };

      window.ethereum?.on('accountsChanged', handleAccountsChanged);
      window.ethereum?.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [walletState.address, walletState.isConnected]);

  // QR Code generation effect
  useEffect(() => {
    if (walletState.address) {
      QRCode.toDataURL(walletState.address, {
        width: 192,
        margin: 2,
        color: {
          dark: '#059669',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR Code generation error:', err));
    }
  }, [walletState.address]);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Check if wallet is still connected
  const checkWalletConnection = async (savedAddress: string) => {
    if (!isMetaMaskInstalled()) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
        // Wallet is still connected, restore state
        const chainId = parseInt(await window.ethereum.request({ method: 'eth_chainId' }), 16);
        
        if (chainId === SEPOLIA_CHAIN_ID) {
          const balance = await getBalance(savedAddress);
          const wethBalance = await getWETHBalance(savedAddress);
          
          setWalletState({
            isConnected: true,
            address: savedAddress,
            balance,
            wethBalance,
            chainId: SEPOLIA_CHAIN_ID
          });

          loadTransactionHistory();
          
          toast({
            title: "Ví đã được khôi phục",
            description: "Kết nối ví đã được khôi phục từ phiên trước",
            duration: 3000
          });
        } else {
          // Wrong network, ask to switch
          await switchToSepolia();
        }
      } else {
        // Wallet disconnected, clear saved state
        localStorage.removeItem('walletState');
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      localStorage.removeItem('walletState');
    }
  };

  // Get WETH balance - FIXED với contract address chính xác
  const getWETHBalance = async (address: string): Promise<string> => {
    try {
      // IMPROVED: Sử dụng đúng function selector cho balanceOf
      const paddedAddress = address.slice(2).padStart(64, '0');
      const data = '0x70a08231' + paddedAddress; // balanceOf(address) function selector
      
      const balance = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: WETH_ADDRESS,
          data: data
        }, 'latest']
      });
      
      console.log('WETH balance response:', balance);
      
      if (!balance || balance === '0x') {
        return '0';
      }
      
      const wethBalance = parseInt(balance, 16) / Math.pow(10, 18);
      return wethBalance.toFixed(6);
    } catch (error) {
      console.error('Error getting WETH balance:', error);
      return '0';
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast({
        title: "MetaMask không được cài đặt",
        description: "Vui lòng cài đặt MetaMask để tiếp tục",
        variant: "destructive",
        duration: 5000
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('Không có tài khoản nào được kết nối');
      }

      const address = accounts[0];
      const chainId = parseInt(await window.ethereum.request({
        method: 'eth_chainId'
      }), 16);

      if (chainId !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
      }

      const balance = await getBalance(address);
      const wethBalance = await getWETHBalance(address);

      setWalletState({
        isConnected: true,
        address,
        balance,
        wethBalance,
        chainId: SEPOLIA_CHAIN_ID
      });

      toast({
        title: "Ví đã được kết nối",
        description: `Địa chỉ: ${address.slice(0, 6)}...${address.slice(-4)}`,
        duration: 3000
      });

      loadTransactionHistory();

    } catch (error: any) {
      console.error('Connection error:', error);
      toast({
        title: "Lỗi kết nối ví",
        description: error.message || "Không thể kết nối đến ví",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to Sepolia network
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia Ether',
                symbol: 'SEP',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io/'],
            }],
          });
        } catch (addError) {
          throw new Error('Không thể thêm mạng Sepolia');
        }
      } else {
        throw new Error('Không thể chuyển sang mạng Sepolia');
      }
    }
  };

  // Get ETH balance
  const getBalance = async (address: string): Promise<string> => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
      return ethBalance.toFixed(6);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  };

  // Save transaction to database
  const saveTransactionToDB = async (transactionData: any) => {
    if (!token || !user) return;

    try {
      const response = await fetch('http://localhost:5000/api/Transaction/SaveTransaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionHash: transactionData.hash,
          fromAddress: transactionData.from,
          toAddress: transactionData.to,
          fromToken: transactionData.fromToken || 'ETH',
          toToken: transactionData.toToken || 'ETH',
          fromAmount: parseFloat(transactionData.fromAmount || transactionData.value),
          toAmount: parseFloat(transactionData.toAmount || transactionData.value),
          transactionType: transactionData.transactionType,
          status: 'PENDING',
          gasUsed: 0,
          gasPrice: 0
        })
      });

      if (response.ok) {
        console.log('Transaction saved to database');
      }
    } catch (error) {
      console.error('Error saving transaction to DB:', error);
    }
  };

  // Swap ETH to WETH hoặc ngược lại
  const performSwap = async () => {
    if (!walletState.isConnected || !swapAmount) {
      toast({
        title: "Thông tin không đầy đủ",
        description: "Vui lòng kết nối ví và nhập số lượng cần swap",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    const amount = parseFloat(swapAmount);
    
    if (swapDirection === 'ETH_TO_WETH') {
      const balance = parseFloat(walletState.balance);
      if (amount <= 0 || amount > balance) {
        toast({
          title: "Số lượng không hợp lệ",
          description: "Số lượng phải lớn hơn 0 và không vượt quá số dư ETH",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
    } else {
      const wethBalance = parseFloat(walletState.wethBalance);
      if (amount <= 0 || amount > wethBalance) {
        toast({
          title: "Số lượng không hợp lệ",
          description: "Số lượng phải lớn hơn 0 và không vượt quá số dư WETH",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
    }

    try {
      setIsSwapping(true);

      let txHash: string;
      const valueInWei = `0x${(amount * Math.pow(10, 18)).toString(16)}`;

      if (swapDirection === 'ETH_TO_WETH') {
        // IMPROVED: Wrap ETH to WETH với better debugging
        console.log('Starting ETH to WETH wrap...');
        console.log('Amount:', amount, 'ETH');
        console.log('Value in Wei:', valueInWei);
        console.log('WETH Contract:', WETH_ADDRESS);
        
        // Verify contract exists
        const code = await window.ethereum.request({
          method: 'eth_getCode',
          params: [WETH_ADDRESS, 'latest']
        });
        
        if (!code || code === '0x') {
          throw new Error('WETH contract not found at address: ' + WETH_ADDRESS);
        }
        
        console.log('Contract verified, proceeding with deposit...');
        
        const depositData = '0xd0e30db0'; // deposit() function selector
        
        const txParams = {
          from: walletState.address,
          to: WETH_ADDRESS,
          value: valueInWei,
          data: depositData,
          gas: '0x15F90', // 90000 gas - Tăng cao hơn nữa
        };
        
        console.log('Transaction params:', txParams);
        
        txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        });

        toast({
          title: "Wrap ETH thành công!",
          description: `Đang wrap ${amount} ETH thành WETH...`,
          duration: 3000
        });
      } else {
        // IMPROVED: Unwrap WETH to ETH với better debugging  
        console.log('Starting WETH to ETH unwrap...');
        console.log('Amount:', amount, 'WETH');
        console.log('Value in Wei:', valueInWei);
        
        // Check WETH balance trước khi unwrap
        const wethBal = await getWETHBalance(walletState.address);
        console.log('Current WETH balance:', wethBal);
        
        if (parseFloat(wethBal) < amount) {
          throw new Error(`Insufficient WETH balance. Have: ${wethBal}, Need: ${amount}`);
        }
        
        const withdrawData = '0x2e1a7d4d' + valueInWei.slice(2).padStart(64, '0'); // withdraw(uint256) function
        
        const txParams = {
          from: walletState.address,
          to: WETH_ADDRESS,
          data: withdrawData,
          gas: '0x15F90', // 90000 gas - Tăng cao hơn nữa
        };
        
        console.log('Transaction params:', txParams);
        
        txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        });

        toast({
          title: "Unwrap WETH thành công!",
          description: `Đang unwrap ${amount} WETH thành ETH...`,
          duration: 3000
        });
      }

      // Create transaction object
      const newTransaction: Transaction = {
        hash: txHash,
        from: walletState.address,
        to: WETH_ADDRESS,
        value: swapAmount,
        status: 'pending',
        timestamp: Date.now(),
        transactionType: 'SWAP',
        fromToken: swapDirection === 'ETH_TO_WETH' ? 'ETH' : 'WETH',
        toToken: swapDirection === 'ETH_TO_WETH' ? 'WETH' : 'ETH',
        fromAmount: swapAmount,
        toAmount: swapAmount
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // Save to database
      await saveTransactionToDB(newTransaction);

      console.log('Transaction hash:', txHash);
      console.log('Etherscan link:', `https://sepolia.etherscan.io/tx/${txHash}`);

      setSwapAmount('');

      // Refresh balances after delay
      setTimeout(async () => {
        const newBalance = await getBalance(walletState.address);
        const newWethBalance = await getWETHBalance(walletState.address);
        setWalletState(prev => ({ 
          ...prev, 
          balance: newBalance,
          wethBalance: newWethBalance
        }));
      }, 5000); // Tăng delay để đợi transaction confirm

      // Monitor transaction
      monitorTransaction(txHash);

    } catch (error: any) {
      console.error('Swap error:', error);
      
      let errorMessage = "Không thể thực hiện swap";
      
      // Handle specific errors
      if (error.code === 4001) {
        errorMessage = "Giao dịch bị từ chối bởi người dùng";
      } else if (error.code === -32603) {
        errorMessage = "Lỗi RPC - Vui lòng thử lại";
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = "Không đủ ETH để trả gas fee";
      } else if (error.message?.includes('gas')) {
        errorMessage = "Lỗi gas - Vui lòng tăng gas limit";
      }
      
      toast({
        title: "Swap thất bại",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsSwapping(false);
    }
  };

  // Send ETH transaction
  const sendTransaction = async () => {
    if (!walletState.isConnected || !recipientAddress || !sendAmount) {
      toast({
        title: "Thông tin không đầy đủ",
        description: "Vui lòng điền đầy đủ thông tin giao dịch",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      toast({
        title: "Địa chỉ không hợp lệ",
        description: "Vui lòng nhập địa chỉ Ethereum hợp lệ",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    const amount = parseFloat(sendAmount);
    const balance = parseFloat(walletState.balance);
    
    if (amount <= 0 || amount > balance) {
      toast({
        title: "Số lượng không hợp lệ",
        description: "Số lượng phải lớn hơn 0 và không vượt quá số dư",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    try {
      setIsLoading(true);

      const valueInWei = `0x${(amount * Math.pow(10, 18)).toString(16)}`;

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletState.address,
          to: recipientAddress,
          value: valueInWei,
          gas: '0x5208',
        }],
      });

      const newTransaction: Transaction = {
        hash: txHash,
        from: walletState.address,
        to: recipientAddress,
        value: sendAmount,
        status: 'pending',
        timestamp: Date.now(),
        transactionType: 'SEND'
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // Save to database
      await saveTransactionToDB(newTransaction);

      toast({
        title: "Giao dịch đã được gửi",
        description: `Hash: ${txHash.slice(0, 10)}...`,
        duration: 5000
      });

      setRecipientAddress('');
      setSendAmount('');

      setTimeout(async () => {
        const newBalance = await getBalance(walletState.address);
        setWalletState(prev => ({ ...prev, balance: newBalance }));
      }, 3000);

      monitorTransaction(txHash);

    } catch (error: any) {
      console.error('Transaction error:', error);
      toast({
        title: "Giao dịch thất bại",
        description: error.message || "Không thể thực hiện giao dịch",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Monitor transaction status
  const monitorTransaction = async (txHash: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const checkStatus = async () => {
      try {
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });

        if (receipt) {
          const status = receipt.status === '0x1' ? 'success' : 'failed';
          
          setTransactions(prev => 
            prev.map(tx => 
              tx.hash === txHash 
                ? { ...tx, status, gasUsed: parseInt(receipt.gasUsed, 16).toString() }
                : tx
            )
          );

          // Update database
          if (token) {
            try {
              await fetch(`http://localhost:5000/api/Transaction/UpdateTransactionStatus?transactionHash=${txHash}&status=${status.toUpperCase()}&gasUsed=${parseInt(receipt.gasUsed, 16)}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
            } catch (error) {
              console.error('Error updating transaction status in DB:', error);
            }
          }

          toast({
            title: status === 'success' ? "Giao dịch thành công" : "Giao dịch thất bại",
            description: `Hash: ${txHash.slice(0, 10)}...`,
            variant: status === 'success' ? "default" : "destructive",
            duration: 3000
          });

          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    };

    checkStatus();
  };

  // Load transaction history from database
  const loadTransactionHistory = async () => {
    if (!token) return;
    
    setLoadingTxs(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/Transaction/GetUserTransactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.statusCode === 1 && Array.isArray(data.data)) {
          const dbTransactions = data.data.map((tx: any) => ({
            hash: tx.transactionHash || '',
            from: tx.fromAddress || '',
            to: tx.toAddress || '',
            value: tx.fromAmount ? tx.fromAmount.toString() : '0',
            status: tx.status ? tx.status.toLowerCase() : 'pending',
            timestamp: tx.createdDate ? new Date(tx.createdDate).getTime() : Date.now(),
            gasUsed: tx.gasUsed ? tx.gasUsed.toString() : '0',
            transactionType: tx.transactionType || 'SEND',
            fromToken: tx.fromToken || 'ETH',
            toToken: tx.toToken || 'ETH',
            fromAmount: tx.fromAmount ? tx.fromAmount.toString() : '0',
            toAmount: tx.toAmount ? tx.toAmount.toString() : '0'
          }));
          setTransactions(dbTransactions);
        } else {
          console.log('No transactions found or invalid response format');
          setTransactions([]);
        }
      } else {
        console.error('Failed to fetch transactions:', response.status);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactions([]);
    } finally {
      setLoadingTxs(false);
    }
  };

  // Test WETH contract connectivity
  const testWETHContract = async () => {
    if (!walletState.isConnected) {
      toast({
        title: "Chưa kết nối ví",
        description: "Vui lòng kết nối ví trước",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    try {
      console.log('Testing WETH contract at:', WETH_ADDRESS);
      
      // 1. Check contract exists
      const code = await window.ethereum.request({
        method: 'eth_getCode',
        params: [WETH_ADDRESS, 'latest']
      });
      
      if (!code || code === '0x') {
        throw new Error('Contract not found');
      }
      
      // 2. Get contract name
      const nameData = '0x06fdde03'; // name() function selector
      const nameResult = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: WETH_ADDRESS,
          data: nameData
        }, 'latest']
      });
      
      // 3. Get WETH balance
      const balance = await getWETHBalance(walletState.address);
      
      toast({
        title: "✅ WETH Contract OK",
        description: `Contract hoạt động bình thường. WETH balance: ${balance}`,
        duration: 5000
      });
      
      console.log('Contract test successful:', {
        address: WETH_ADDRESS,
        codeLength: code.length,
        nameResponse: nameResult,
        wethBalance: balance
      });
      
    } catch (error: any) {
      console.error('Contract test failed:', error);
      toast({
        title: "❌ WETH Contract Error",
        description: error.message || "Contract không hoạt động",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Nội dung đã được sao chép vào clipboard",
      duration: 2000
    });
  };

  // Format address for display
  const formatAddress = (address: string | undefined | null) => {
    if (!address || typeof address !== 'string' || address.length < 10) {
      return 'Invalid Address';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: '',
      balance: '0',
      wethBalance: '0',
      chainId: 0
    });
    setTransactions([]);
    localStorage.removeItem('walletState');
    
    toast({
      title: "Ví đã được ngắt kết nối",
      description: "Bạn đã ngắt kết nối khỏi ví thành công",
      duration: 3000
    });
  };

  // Generate QR code when wallet address changes
  useEffect(() => {
    if (walletState.address) {
      QRCode.toDataURL(walletState.address, {
        width: 192,
        margin: 2,
        color: {
          dark: '#059669',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('QR Code generation error:', err));
    }
  }, [walletState.address]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading Platform</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Wallet Connection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Kết nối ví
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!walletState.isConnected ? (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Kết nối ví
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Kết nối ví để bắt đầu giao dịch trên blockchain
                    </p>
                    <Button
                      onClick={connectWallet}
                      disabled={isLoading}
                      className="bg-green-500 hover:bg-orange-600 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang kết nối...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Kết nối ví
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Đã kết nối</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatAddress(walletState.address)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(walletState.address)}
                            className="ml-2 h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          Sepolia
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={disconnectWallet}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Ngắt kết nối
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">ETH:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{walletState.balance}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">WETH:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{walletState.wethBalance}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const newBalance = await getBalance(walletState.address);
                                const newWethBalance = await getWETHBalance(walletState.address);
                                setWalletState(prev => ({ 
                                  ...prev, 
                                  balance: newBalance,
                                  wethBalance: newWethBalance
                                }));
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction Interface */}
            {walletState.isConnected && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Giao dịch</CardTitle>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <Button
                        variant={activeTab === 'send' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('send')}
                        className="h-8"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Gửi
                      </Button>
                      <Button
                        variant={activeTab === 'swap' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('swap')}
                        className="h-8"
                      >
                        <ArrowUpDown className="h-4 w-4 mr-1" />
                        Swap
                      </Button>
                      <Button
                        variant={activeTab === 'receive' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('receive')}
                        className="h-8"
                      >
                        Nhận
                      </Button>
                      <Button
                        variant={activeTab === 'history' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setActiveTab('history')}
                        className="h-8"
                      >
                        Lịch sử
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeTab === 'send' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient">Địa chỉ người nhận</Label>
                        <Input
                          id="recipient"
                          placeholder="0x..."
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount">Số lượng (ETH)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.000001"
                          placeholder="0.0"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                        />
                        <div className="text-xs text-gray-500">
                          Số dư khả dụng: {walletState.balance} ETH
                        </div>
                      </div>

                      <Button
                        onClick={sendTransaction}
                        disabled={isLoading || !recipientAddress || !sendAmount}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Gửi ETH
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {activeTab === 'swap' && (
                    <div className="space-y-6">
                      {/* Swap Direction */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            ETH ⇄ WETH Swap
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSwapDirection(swapDirection === 'ETH_TO_WETH' ? 'WETH_TO_ETH' : 'ETH_TO_WETH')}
                            className="flex items-center gap-2"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                            Đảo chiều
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-center space-x-4">
                            <div className="text-center">
                              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-emerald-300">
                                <div className="text-sm text-gray-600">Từ</div>
                                <div className="font-bold text-lg text-emerald-600">
                                  {swapDirection === 'ETH_TO_WETH' ? 'ETH' : 'WETH'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Số dư: {swapDirection === 'ETH_TO_WETH' ? walletState.balance : walletState.wethBalance}
                                </div>
                              </div>
                            </div>
                            
                            <ArrowUpDown className="h-6 w-6 text-emerald-600" />
                            
                            <div className="text-center">
                              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-teal-300">
                                <div className="text-sm text-gray-600">Đến</div>
                                <div className="font-bold text-lg text-teal-600">
                                  {swapDirection === 'ETH_TO_WETH' ? 'WETH' : 'ETH'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Tỷ lệ: 1:1
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="swapAmount">
                              Số lượng {swapDirection === 'ETH_TO_WETH' ? 'ETH' : 'WETH'} cần swap
                            </Label>
                            <div className="relative">
                              <Input
                                id="swapAmount"
                                type="number"
                                step="0.000001"
                                placeholder="0.0"
                                value={swapAmount}
                                onChange={(e) => setSwapAmount(e.target.value)}
                                className="text-right pr-16"
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                                {swapDirection === 'ETH_TO_WETH' ? 'ETH' : 'WETH'}
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>
                                Số dư khả dụng: {swapDirection === 'ETH_TO_WETH' ? walletState.balance : walletState.wethBalance}
                              </span>
                              <button
                                onClick={() => setSwapAmount(swapDirection === 'ETH_TO_WETH' ? walletState.balance : walletState.wethBalance)}
                                className="text-emerald-600 hover:text-emerald-700"
                              >
                                Max
                              </button>
                            </div>
                          </div>

                          {swapAmount && (
                            <div className="bg-white rounded-lg p-4 border">
                              <div className="text-sm text-gray-600 mb-2">Bạn sẽ nhận được:</div>
                              <div className="text-lg font-bold text-teal-600">
                                {swapAmount} {swapDirection === 'ETH_TO_WETH' ? 'WETH' : 'ETH'}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Tỷ lệ swap: 1 {swapDirection === 'ETH_TO_WETH' ? 'ETH' : 'WETH'} = 1 {swapDirection === 'ETH_TO_WETH' ? 'WETH' : 'ETH'}
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={performSwap}
                            disabled={isSwapping || !swapAmount}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                            size="lg"
                          >
                            {isSwapping ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang swap...
                              </>
                            ) : (
                              <>
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                Swap {swapDirection === 'ETH_TO_WETH' ? 'ETH → WETH' : 'WETH → ETH'}
                              </>
                            )}
                          </Button>

                          {/* Test Contract Button */}
                          <Button
                            onClick={testWETHContract}
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                          >
                            🔧 Test WETH Contract
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'receive' && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 inline-block">
                          <div className="w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                            {qrCodeUrl ? (
                              <img 
                                src={qrCodeUrl} 
                                alt="QR Code cho địa chỉ ví" 
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                <div className="text-center">
                                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500">Đang tạo QR Code...</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-3">Quét để gửi token trên EVM</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-center mb-4">
                          <h3 className="font-semibold text-gray-900 mb-1">Địa chỉ ví của bạn</h3>
                          <p className="text-sm text-gray-600">Chia sẻ địa chỉ này để nhận token trên các mạng EVM</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="font-mono text-sm break-all text-center text-gray-800 mb-4">
                            {walletState.address}
                          </div>
                          
                          <div className="flex gap-3">
                            <Button
                              onClick={() => copyToClipboard(walletState.address)}
                              variant="outline"
                              className="flex-1"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Sao chép địa chỉ
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-4">
                      {loadingTxs ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Clock className="h-8 w-8 mx-auto mb-2" />
                          <p>Chưa có giao dịch nào</p>
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          {transactions.map((tx) => (
                            <div key={tx.hash} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {tx.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                                  {tx.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                  {tx.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                  <span className="font-medium">
                                    {tx.transactionType === 'SWAP' ? (
                                      <span className="flex items-center gap-1">
                                        <ArrowUpDown className="h-4 w-4" />
                                        Swap {tx.fromToken} → {tx.toToken}
                                      </span>
                                    ) : tx.from && tx.from.toLowerCase() === walletState.address.toLowerCase() ? 'Gửi' : 'Nhận'}
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    tx.status === 'success' ? 'default' :
                                    tx.status === 'pending' ? 'secondary' : 'destructive'
                                  }
                                >
                                  {tx.status === 'success' ? 'Thành công' :
                                   tx.status === 'pending' ? 'Đang chờ' : 'Thất bại'}
                                </Badge>
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                {tx.transactionType === 'SWAP' ? (
                                  <>
                                    <div>Swap: {tx.fromAmount || tx.value} {tx.fromToken || 'ETH'} → {tx.toAmount || tx.value} {tx.toToken || 'WETH'}</div>
                                    <div>Contract: {formatAddress(tx.to)}</div>
                                  </>
                                ) : (
                                  <>
                                    <div>Số lượng: {tx.value || '0'} ETH</div>
                                    <div>Từ: {formatAddress(tx.from)}</div>
                                    <div>Đến: {formatAddress(tx.to)}</div>
                                  </>
                                )}
                                <div>Thời gian: {formatTime(tx.timestamp)}</div>
                                <div className="flex items-center gap-2">
                                  <span>Hash: {formatAddress(tx.hash)}</span>
                                  {tx.hash && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, '_blank')}
                                      className="h-5 w-5 p-0"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            

            {/* Network Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin mạng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mạng:</span>
                  <span className="text-sm font-medium">Sepolia</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Chain ID:</span>
                  <span className="text-sm font-medium">{SEPOLIA_CHAIN_ID}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">WETH Contract:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://sepolia.etherscan.io/address/${WETH_ADDRESS}`, '_blank')}
                    className="h-auto p-0 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {formatAddress(WETH_ADDRESS)}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Explorer:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('https://sepolia.etherscan.io/', '_blank')}
                    className="h-auto p-0 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Etherscan
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Faucet */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nhận Sepolia ETH miễn phí</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Cần Sepolia ETH để test? Sử dụng các faucet sau:
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://sepoliafaucet.com/', '_blank')}
                    className="w-full justify-between"
                  >
                    Sepolia Faucet
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://faucets.chain.link/sepolia', '_blank')}
                    className="w-full justify-between"
                  >
                    Chainlink Faucet
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}