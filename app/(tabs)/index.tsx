import { View, Text, FlatList, Image, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Product, Invoice } from '../../types';
import { useState } from 'react';

// Helper to calculate days remaining
const getDaysRemaining = (expiryDateString: string) => {
  const expiryDate = new Date(expiryDateString);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper to determine status color
const getStatusColor = (expiryDateString: string) => {
  const days = getDaysRemaining(expiryDateString);
  if (days < 0) return Colors.status.expired;
  if (days < 30) return Colors.status.danger;
  if (days < 180) return Colors.status.warning;
  return Colors.status.good;
};

const WarrantyCard = ({ product }: { product: Product }) => {
  const statusColor = getStatusColor(product.warranty_end_date);
  const daysRemaining = getDaysRemaining(product.warranty_end_date);

  return (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-100 flex-row items-center">
      {/* Status Indicator */}
      <View style={{ backgroundColor: statusColor, width: 4, height: '100%', borderRadius: 2, marginRight: 12 }} />

      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-900">{product.name}</Text>
        <Text className="text-gray-500 text-sm mt-1">
          {product.invoice?.store_name} • {new Date(product.invoice?.purchase_date || '').toLocaleDateString('pt-PT')}
        </Text>
        <Text className={`text-sm mt-2 font-medium ${daysRemaining < 0 ? 'text-gray-400' : 'text-gray-700'}`}>
          {daysRemaining < 0
            ? 'Expirada'
            : `${daysRemaining} dias restantes`}
        </Text>
      </View>

      {/* Product Image Placeholder (using Invoice Image) */}
      {product.invoice?.image_url && (
        <Image
          source={{ uri: product.invoice.image_url }}
          className="w-16 h-16 rounded-md bg-gray-200"
          resizeMode="cover"
        />
      )}
    </View>
  );
};

export default function DashboardScreen() {
  // Mock Data
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      invoice_id: 'inv1',
      name: 'MacBook Pro M3',
      warranty_months: 36,
      warranty_end_date: '2026-11-15',
      is_active: true,
      created_at: new Date().toISOString(),
      invoice: {
        id: 'inv1',
        user_id: 'user1',
        image_url: 'https://via.placeholder.com/150',
        store_name: 'FNAC',
        purchase_date: '2023-11-15',
        created_at: new Date().toISOString(),
      }
    },
    {
      id: '2',
      invoice_id: 'inv2',
      name: 'AirPods Pro',
      warranty_months: 24,
      warranty_end_date: '2024-05-20', // Warning (< 6 months from now roughly)
      is_active: true,
      created_at: new Date().toISOString(),
      invoice: {
        id: 'inv2',
        user_id: 'user1',
        image_url: 'https://via.placeholder.com/150',
        store_name: 'Worten',
        purchase_date: '2022-05-20',
        created_at: new Date().toISOString(),
      }
    },
    {
      id: '3',
      invoice_id: 'inv3',
      name: 'Monitor Dell 27"',
      warranty_months: 36,
      warranty_end_date: '2024-01-15', // Expired or Danger depending on current date
      is_active: true,
      created_at: new Date().toISOString(),
      invoice: {
        id: 'inv3',
        user_id: 'user1',
        image_url: 'https://via.placeholder.com/150',
        store_name: 'PCDIGA',
        purchase_date: '2021-01-15',
        created_at: new Date().toISOString(),
      }
    }
  ]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-8">
      <StatusBar barStyle="dark-content" />
      <View className="px-5 pb-4">
        <Text className="text-3xl font-bold text-gray-900">As minhas garantias</Text>
        <Text className="text-gray-500 mt-1">Tens {products.length} garantias ativas</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WarrantyCard product={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
