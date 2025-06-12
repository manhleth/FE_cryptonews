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
  Loader2
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

// Types
interface WalletState {
  isConnected: boolean;
  address: string;
  balance: string;
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
}

// Constants
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/your-project-id';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function TradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Redirect if not logged in
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

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Wallet state
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: '',
    balance: '0',
    chainId: 0
  });

  // Transaction form state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Transaction history
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // UI state
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'history'>('send');

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
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
      
      // Request account access
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

      // Switch to Sepolia if not already on it
      if (chainId !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
      }

      // Get balance
      const balance = await getBalance(address);

      setWalletState({
        isConnected: true,
        address,
        balance,
        chainId: SEPOLIA_CHAIN_ID
      });

      toast({
        title: "Ví đã được kết nối",
        description: `Địa chỉ: ${address.slice(0, 6)}...${address.slice(-4)}`,
        duration: 3000
      });

      // Load transaction history
      loadTransactionHistory(address);

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
      // This error code indicates that the chain has not been added to MetaMask
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
      
      // Convert from wei to ETH
      const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
      return ethBalance.toFixed(6);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
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

    // Validate address
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      toast({
        title: "Địa chỉ không hợp lệ",
        description: "Vui lòng nhập địa chỉ Ethereum hợp lệ",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    // Validate amount
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

      // Convert ETH to wei
      const valueInWei = `0x${(amount * Math.pow(10, 18)).toString(16)}`;

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletState.address,
          to: recipientAddress,
          value: valueInWei,
          gas: '0x5208', // 21000 gas for simple transfer
        }],
      });

      // Add to transaction history
      const newTransaction: Transaction = {
        hash: txHash,
        from: walletState.address,
        to: recipientAddress,
        value: sendAmount,
        status: 'pending',
        timestamp: Date.now()
      };

      setTransactions(prev => [newTransaction, ...prev]);

      toast({
        title: "Giao dịch đã được gửi",
        description: `Hash: ${txHash.slice(0, 10)}...`,
        duration: 5000
      });

      // Reset form
      setRecipientAddress('');
      setSendAmount('');

      // Refresh balance after a delay
      setTimeout(async () => {
        const newBalance = await getBalance(walletState.address);
        setWalletState(prev => ({ ...prev, balance: newBalance }));
      }, 3000);

      // Monitor transaction status
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
    const maxAttempts = 30; // 5 minutes with 10-second intervals

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
          setTimeout(checkStatus, 10000); // Check again in 10 seconds
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    };

    checkStatus();
  };

  // Load transaction history (mock implementation)
  const loadTransactionHistory = async (address: string) => {
    setLoadingTxs(true);
    
    // Mock transaction history
    const mockTxs: Transaction[] = [
      {
        hash: '0x1234567890abcdef1234567890abcdef12345678',
        from: address,
        to: '0xabcdef1234567890abcdef1234567890abcdef12',
        value: '0.05',
        status: 'success',
        timestamp: Date.now() - 3600000,
        gasUsed: '21000'
      },
      {
        hash: '0xabcdef1234567890abcdef1234567890abcdef12',
        from: '0x9876543210fedcba9876543210fedcba98765432',
        to: address,
        value: '0.1',
        status: 'success',
        timestamp: Date.now() - 7200000,
        gasUsed: '21000'
      }
    ];

    setTimeout(() => {
      setTransactions(mockTxs);
      setLoadingTxs(false);
    }, 1000);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã sao chép",
      description: "Nội dung đã được sao chép vào clipboard",
      duration: 2000
    });
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  // Listen for account changes
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState({
            isConnected: false,
            address: '',
            balance: '0',
            chainId: 0
          });
        } else {
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        if (newChainId !== SEPOLIA_CHAIN_ID) {
          switchToSepolia();
        }
      });
    }
  }, []);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Giao dịch Sepolia ETH</h1>
          <p className="text-gray-600">Gửi và nhận Sepolia ETH trên mạng testnet</p>
        </div>

        {/* Warning Banner */}
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Lưu ý:</span>
              <span>Đây là mạng testnet Sepolia. Không sử dụng ETH thật!</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Connection */}
          <div className="lg:col-span-2">
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
                      Kết nối MetaMask
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Kết nối ví MetaMask để bắt đầu giao dịch trên mạng Sepolia
                    </p>
                    <Button
                      onClick={connectWallet}
                      disabled={isLoading}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang kết nối...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Kết nối MetaMask
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
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Sepolia
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Số dư:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{walletState.balance} ETH</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const newBalance = await getBalance(walletState.address);
                              setWalletState(prev => ({ ...prev, balance: newBalance }));
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
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
                        Gửi
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

                  {activeTab === 'receive' && (
                    <div className="space-y-6">
                      {/* QR Code Section */}
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
                          <p className="text-sm text-gray-600 mt-3">Quét để gửi Sepolia ETH</p>
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-center mb-4">
                          <h3 className="font-semibold text-gray-900 mb-1">Địa chỉ ví của bạn</h3>
                          <p className="text-sm text-gray-600">Chia sẻ địa chỉ này để nhận Sepolia ETH</p>
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

                      {/* Network Info */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Lưu ý quan trọng</p>
                            <p className="text-sm">Chỉ nhận Sepolia ETH trên mạng testnet. Không gửi ETH thật!</p>
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
                        transactions.map((tx) => (
                          <div key={tx.hash} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {tx.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                                {tx.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {tx.status === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                <span className="font-medium">
                                  {tx.from.toLowerCase() === walletState.address.toLowerCase() ? 'Gửi' : 'Nhận'}
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
                              <div>Số lượng: {tx.value} ETH</div>
                              <div>Từ: {formatAddress(tx.from)}</div>
                              <div>Đến: {formatAddress(tx.to)}</div>
                              <div>Thời gian: {formatTime(tx.timestamp)}</div>
                              <div className="flex items-center gap-2">
                                <span>Hash: {formatAddress(tx.hash)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, '_blank')}
                                  className="h-5 w-5 p-0"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
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

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lưu ý quan trọng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Chỉ sử dụng trên mạng testnet Sepolia</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Kiểm tra kỹ địa chỉ trước khi gửi</span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Giao dịch có thể mất vài phút để xác nhận</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}